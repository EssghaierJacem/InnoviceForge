package com.invoiceforge.ingestion_service.controller;

import com.invoiceforge.ingestion_service.model.Invoice;
import com.invoiceforge.ingestion_service.repository.InvoiceRepository;
import com.invoiceforge.ingestion_service.service.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceService invoiceService, InvoiceRepository invoiceRepository) {
        this.invoiceService = invoiceService;
        this.invoiceRepository = invoiceRepository;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        UUID userId = UUID.fromString(jwt.getSubject());

        Invoice invoice = invoiceService.upload(readBytes(file), file.getOriginalFilename(), userId, tenantId);

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .location(URI.create("/api/v1/invoices/" + invoice.getId()))
                .body(Map.of("id", invoice.getId(), "status", invoice.getStatus()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> get(
            @PathVariable UUID id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String tenantId = jwt.getClaimAsString("tenant_id");
        return invoiceRepository.findByIdAndTenantId(id, tenantId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
