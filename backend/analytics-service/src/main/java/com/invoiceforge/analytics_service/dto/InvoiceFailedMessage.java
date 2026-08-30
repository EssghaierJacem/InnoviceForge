package com.invoiceforge.analytics_service.dto;

import java.util.UUID;

public record InvoiceFailedMessage(UUID invoiceId, String tenantId, String reason) {
}
