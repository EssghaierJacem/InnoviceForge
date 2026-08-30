package com.invoiceforge.ingestion_service.controller;

import com.invoiceforge.ingestion_service.service.TenantProvisioningService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TenantController {

    private final TenantProvisioningService tenantProvisioningService;

    public TenantController(TenantProvisioningService tenantProvisioningService) {
        this.tenantProvisioningService = tenantProvisioningService;
    }

    /**
     * Must work for a JWT with no tenant_id claim at all — that's exactly
     * the case this endpoint exists to fix — so it identifies the caller
     * via the "sub" claim (always present) rather than tenant_id.
     */
    @PostMapping("/api/v1/tenant/provision")
    public ResponseEntity<Map<String, Boolean>> provision(@AuthenticationPrincipal Jwt jwt) {
        boolean provisioned = tenantProvisioningService.provisionIfNeeded(jwt.getSubject());
        return ResponseEntity.ok(Map.of("provisioned", provisioned));
    }
}
