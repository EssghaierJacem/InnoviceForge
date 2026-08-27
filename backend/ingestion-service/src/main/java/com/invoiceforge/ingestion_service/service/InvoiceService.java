package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.model.Invoice;
import com.invoiceforge.ingestion_service.repository.InvoiceStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    private final InvoiceStore store;

    public InvoiceService(InvoiceStore store) {
        this.store = store;
    }

    public Invoice upload(String tenantId, String fileKey) {
        String validFileKey = Optional.ofNullable(fileKey)
                .filter(key -> !key.isBlank())
                .orElseThrow(() -> new IllegalArgumentException("fileKey is required"));
        Invoice invoice = Invoice.create(tenantId, validFileKey);
        return store.save(invoice);
    }

    public List<Invoice> listForTenant(String tenantId) {
        return store.findByTenant(tenantId);
    }
}