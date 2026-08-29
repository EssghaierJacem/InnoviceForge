package com.invoiceforge.ingestion_service.repository;

import com.invoiceforge.ingestion_service.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    long countByFileHashAndUserId(String fileHash, UUID userId);

    Optional<Invoice> findByIdAndTenantId(UUID id, String tenantId);
}
