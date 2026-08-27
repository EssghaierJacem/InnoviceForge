package com.invoiceforge.ingestion_service.repository;

import com.invoiceforge.ingestion_service.model.Invoice;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class InvoiceStore {

    private final List<Invoice> invoices = new CopyOnWriteArrayList<>();

    public Invoice save(Invoice invoice) {
        invoices.add(invoice);
        return invoice;
    }

    public List<Invoice> findByTenant(String tenantId) {
        return invoices.stream()
                .filter(invoice -> invoice.tenantId().equals(tenantId))
                .toList();
    }
}