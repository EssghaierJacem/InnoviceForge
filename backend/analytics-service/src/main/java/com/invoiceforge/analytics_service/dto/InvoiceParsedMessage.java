package com.invoiceforge.analytics_service.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record InvoiceParsedMessage(
        UUID invoiceId,
        String tenantId,
        String status,
        String vendorName,
        String contactName,
        String invoiceNumber,
        String poNumber,
        String issueDate,
        String dueDate,
        String currency,
        BigDecimal totalAmount,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        String paymentTerms,
        String paymentMethod,
        List<Object> lineItems,
        String category,
        BigDecimal confidenceScore
) {
}
