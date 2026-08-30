package com.invoiceforge.analytics_service.repository;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExtractedInvoiceRepository extends JpaRepository<ExtractedInvoice, UUID> {

    List<ExtractedInvoice> findByTenantId(String tenantId);

    Page<ExtractedInvoice> findByTenantIdOrderByCreatedAtDesc(String tenantId, Pageable pageable);

    Optional<ExtractedInvoice> findByIdAndTenantId(UUID id, String tenantId);

    Optional<ExtractedInvoice> findByInvoiceId(UUID invoiceId);

    Optional<ExtractedInvoice> findByInvoiceIdAndTenantId(UUID invoiceId, String tenantId);
}
