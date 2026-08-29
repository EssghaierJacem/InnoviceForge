package com.invoiceforge.analytics_service.dto;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PublicExtractionResultDTO(
        String vendorName,
        String contactName,
        String invoiceNumber,
        String poNumber,
        LocalDate issueDate,
        LocalDate dueDate,
        String currency,
        BigDecimal totalAmount,
        BigDecimal subtotal,
        BigDecimal taxAmount,
        String paymentTerms,
        String paymentMethod,
        String category,
        String lineItems,
        BigDecimal confidenceScore,
        String status
) {

    public static PublicExtractionResultDTO from(ExtractedInvoice invoice) {
        return new PublicExtractionResultDTO(
                invoice.getVendorName(),
                invoice.getContactName(),
                invoice.getInvoiceNumber(),
                invoice.getPoNumber(),
                invoice.getIssueDate(),
                invoice.getDueDate(),
                invoice.getCurrency(),
                invoice.getTotalAmount(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getPaymentTerms(),
                invoice.getPaymentMethod(),
                invoice.getCategory(),
                invoice.getLineItems(),
                invoice.getConfidenceScore(),
                invoice.getStatus()
        );
    }
}
