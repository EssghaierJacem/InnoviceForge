package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.repository.TenantPlanRepository;
import org.springframework.stereotype.Service;

@Service
public class PlanService {

    private final TenantPlanRepository tenantPlanRepository;

    public PlanService(TenantPlanRepository tenantPlanRepository) {
        this.tenantPlanRepository = tenantPlanRepository;
    }

    public TenantPlan.Plan getPlan(String tenantId) {
        return tenantPlanRepository.findById(tenantId)
                .map(TenantPlan::getPlan)
                .orElse(TenantPlan.Plan.FREE);
    }
}
