package com.invoiceforge.events;

import java.time.Instant;
import java.util.UUID;

public record InvoiceUploadedEvent(
        UUID eventId,
        UUID invoiceId,
        UUID tenantId,
        String fileKey,
        Instant occurredAt
) {
    public static InvoiceUploadedEvent of(UUID invoiceId, UUID tenantId, String fileKey) {
        return new InvoiceUploadedEvent(UUID.randomUUID(), invoiceId, tenantId, fileKey, Instant.now());
    }
}