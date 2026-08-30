package com.invoiceforge.ingestion_service.port;

public interface QuotaPort {

    boolean tryConsumeDailyQuota(String tenantId);

    boolean tryConsumeAnonymousQuota(String ipAddress);

    /** Read-only — must never consume a quota slot just by checking it. */
    QuotaStatus getStatus(String tenantId);
}
