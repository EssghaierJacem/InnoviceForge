package com.invoiceforge.ingestion_service.model;

import java.time.Instant;
import java.util.UUID;

public record Invoice(
        UUID id,
        String tenantId,
        String fileKey,
        Instant createdAt
) {
    public static Invoice create(String tenantId, String fileKey) {
        return new Invoice(UUID.randomUUID(), tenantId, fileKey, Instant.now());
    }
}