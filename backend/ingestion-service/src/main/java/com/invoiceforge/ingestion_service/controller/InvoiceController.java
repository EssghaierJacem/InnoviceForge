package com.invoiceforge.ingestion_service.controller;

import com.invoiceforge.ingestion_service.dto.request.UploadRequestDTO;
import com.invoiceforge.ingestion_service.model.Invoice;
import com.invoiceforge.ingestion_service.service.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @PostMapping
    public ResponseEntity<Invoice> upload(
            @RequestBody UploadRequestDTO request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        Invoice saved = invoiceService.upload(tenantId, request.fileKey());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(saved);
    }

    @GetMapping
    public List<Invoice> list(@AuthenticationPrincipal Jwt jwt) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        return invoiceService.listForTenant(tenantId);
    }
}