package com.invoiceforge.ingestion_service.controller;

import com.invoiceforge.ingestion_service.port.QuotaPort;
import com.invoiceforge.ingestion_service.port.QuotaStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QuotaController {

    private static final Logger log = LoggerFactory.getLogger(QuotaController.class);

    private final QuotaPort quotaPort;

    public QuotaController(QuotaPort quotaPort) {
        this.quotaPort = quotaPort;
    }

    @GetMapping("/api/v1/quota/status")
    public ResponseEntity<QuotaStatus> status(@AuthenticationPrincipal Jwt jwt) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId == null || tenantId.isBlank()) {
            // Self-registered accounts don't get tenant_id auto-assigned — it's an
            // admin-only-editable attribute by design (see NOTES.md D11). Without
            // this guard, PlanService/RedisQuotaAdapter would NPE on a null id and
            // this would 500 with no useful signal for exactly that case.
            log.warn("Quota status requested with no tenant_id claim on the token (sub={})", jwt.getSubject());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(quotaPort.getStatus(tenantId));
    }
}
