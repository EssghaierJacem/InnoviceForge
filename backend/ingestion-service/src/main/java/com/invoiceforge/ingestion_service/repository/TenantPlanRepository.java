package com.invoiceforge.ingestion_service.repository;

import com.invoiceforge.ingestion_service.model.TenantPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantPlanRepository extends JpaRepository<TenantPlan, String> {
}
