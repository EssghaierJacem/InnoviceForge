package com.invoiceforge.ingestion_service.port;

import com.invoiceforge.ingestion_service.model.TenantPlan;

/**
 * dailyLimit/remaining are -1 for PRO — "unlimited" as a sentinel rather than
 * e.g. Integer.MAX_VALUE, since -1 is unambiguous over the wire and the
 * frontend can check `remaining < 0` directly instead of guessing at what
 * counts as "basically infinite".
 */
public record QuotaStatus(TenantPlan.Plan plan, int dailyLimit, int used, int remaining) {

    public static final int UNLIMITED = -1;
}
