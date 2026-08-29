package com.invoiceforge.analytics_service.controller;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports/invoices")
@RequiredArgsConstructor
public class ExtractedInvoiceController {

    private final ExtractedInvoiceRepository extractedInvoiceRepository;

    @GetMapping
    public List<ExtractedInvoice> list(@AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByTenantId(jwt.getClaimAsString("tenant_id"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExtractedInvoice> getById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        return extractedInvoiceRepository.findByIdAndTenantId(id, jwt.getClaimAsString("tenant_id"))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
