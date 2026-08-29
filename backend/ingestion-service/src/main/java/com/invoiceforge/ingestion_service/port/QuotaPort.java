package com.invoiceforge.ingestion_service.port;

public interface QuotaPort {

    boolean tryConsumeDailyQuota(String tenantId);

    boolean tryConsumeAnonymousQuota(String ipAddress);
}
