package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.repository.TenantPlanRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Self-registered Keycloak users get no tenant_id attribute — it's an
 * admin-only-editable field (see the "tenant_id" user profile attribute in
 * realm-export.json), so a plain user token can never set it on itself.
 * This talks to Keycloak's Admin REST API as a confidential service-account
 * client ("backend-admin", client_credentials grant) to assign one.
 *
 * A plain RestClient call was used instead of the keycloak-admin-client
 * library: that library pulls in its own RESTEasy/Jakarta REST client stack,
 * which is unnecessary weight (and a possible classpath conflict with Spring
 * MVC's own client stack) for the two endpoints actually needed here.
 */
@Service
@Slf4j
public class TenantProvisioningService {

    private final RestClient restClient;
    private final TenantPlanRepository tenantPlanRepository;
    private final String realm;
    private final String adminClientId;
    private final String adminClientSecret;

    public TenantProvisioningService(
            TenantPlanRepository tenantPlanRepository,
            @Value("${keycloak.admin.base-url}") String baseUrl,
            @Value("${keycloak.admin.realm}") String realm,
            @Value("${keycloak.admin.client-id}") String adminClientId,
            @Value("${keycloak.admin.client-secret}") String adminClientSecret
    ) {
        this.tenantPlanRepository = tenantPlanRepository;
        this.realm = realm;
        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    /**
     * Idempotent: returns false without touching Keycloak or the DB if the
     * user already has a tenant_id attribute.
     */
    @SuppressWarnings("unchecked")
    public boolean provisionIfNeeded(String keycloakUserId) {
        String accessToken = fetchAdminAccessToken();

        Map<String, Object> user = restClient.get()
                .uri("/admin/realms/{realm}/users/{id}", realm, keycloakUserId)
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);

        Map<String, Object> attributes = user.get("attributes") != null
                ? new HashMap<>((Map<String, Object>) user.get("attributes"))
                : new HashMap<>();

        if (hasTenantId(attributes)) {
            return false;
        }

        String tenantId = UUID.randomUUID().toString();
        attributes.put("tenant_id", List.of(tenantId));
        user.put("attributes", attributes);

        // PUT takes the full user representation (fetched above), not a
        // partial patch — Keycloak's admin API replaces the attributes map
        // wholesale on PUT, so round-tripping the existing one is what
        // keeps every other attribute from being wiped out.
        restClient.put()
                .uri("/admin/realms/{realm}/users/{id}", realm, keycloakUserId)
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(user)
                .retrieve()
                .toBodilessEntity();

        tenantPlanRepository.save(new TenantPlan(tenantId, TenantPlan.Plan.FREE));
        log.info("Provisioned new tenant {} for Keycloak user {}", tenantId, keycloakUserId);
        return true;
    }

    @SuppressWarnings("unchecked")
    private boolean hasTenantId(Map<String, Object> attributes) {
        Object raw = attributes.get("tenant_id");
        if (!(raw instanceof List<?> values) || values.isEmpty()) {
            return false;
        }
        Object first = values.get(0);
        return first instanceof String s && !s.isBlank();
    }

    @SuppressWarnings("unchecked")
    private String fetchAdminAccessToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", adminClientId);
        form.add("client_secret", adminClientSecret);

        Map<String, Object> response = restClient.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        return (String) response.get("access_token");
    }
}
