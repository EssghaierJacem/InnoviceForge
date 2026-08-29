package com.invoiceforge.analytics_service.dto;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PublicExtractionResultDTO(
        String vendorName,
        String invoiceNumber,
        LocalDate issueDate,
        String currency,
        BigDecimal totalAmount,
        BigDecimal taxAmount,
        String category,
        String lineItems,
        BigDecimal confidenceScore,
        String status
) {

    public static PublicExtractionResultDTO from(ExtractedInvoice invoice) {
        return new PublicExtractionResultDTO(
                invoice.getVendorName(),
                invoice.getInvoiceNumber(),
                invoice.getIssueDate(),
                invoice.getCurrency(),
                invoice.getTotalAmount(),
                invoice.getTaxAmount(),
                invoice.getCategory(),
                invoice.getLineItems(),
                invoice.getConfidenceScore(),
                invoice.getStatus()
        );
    }
}
