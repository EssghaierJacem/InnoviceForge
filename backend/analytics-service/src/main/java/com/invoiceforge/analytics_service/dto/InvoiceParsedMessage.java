package com.invoiceforge.analytics_service.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record InvoiceParsedMessage(
        UUID invoiceId,
        String tenantId,
        String status,
        String vendorName,
        String invoiceNumber,
        String issueDate,
        String currency,
        BigDecimal totalAmount,
        BigDecimal taxAmount,
        List<Object> lineItems,
        String category,
        BigDecimal confidenceScore
) {
}
