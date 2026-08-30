package com.invoiceforge.ingestion_service.adapter.quota;

import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.port.QuotaPort;
import com.invoiceforge.ingestion_service.port.QuotaStatus;
import com.invoiceforge.ingestion_service.service.PlanService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

@Component
public class RedisQuotaAdapter implements QuotaPort {

    private static final int DAILY_LIMIT = 5;
    private static final int ANONYMOUS_LIMIT = 3;
    private static final Duration COUNTER_TTL = Duration.ofHours(26);

    private final StringRedisTemplate redisTemplate;
    private final PlanService planService;

    public RedisQuotaAdapter(StringRedisTemplate redisTemplate, PlanService planService) {
        this.redisTemplate = redisTemplate;
        this.planService = planService;
    }

    @Override
    public boolean tryConsumeDailyQuota(String tenantId) {
        return tryConsume("usage:daily:" + tenantId + ":" + today(), DAILY_LIMIT);
    }

    @Override
    public boolean tryConsumeAnonymousQuota(String ipAddress) {
        return tryConsume("usage:anon:" + ipAddress + ":" + today(), ANONYMOUS_LIMIT);
    }

    @Override
    public QuotaStatus getStatus(String tenantId) {
        TenantPlan.Plan plan = planService.getPlan(tenantId);
        if (plan == TenantPlan.Plan.PRO) {
            return new QuotaStatus(plan, QuotaStatus.UNLIMITED, QuotaStatus.UNLIMITED, QuotaStatus.UNLIMITED);
        }

        int used = currentCount("usage:daily:" + tenantId + ":" + today());
        return new QuotaStatus(plan, DAILY_LIMIT, used, Math.max(0, DAILY_LIMIT - used));
    }

    private boolean tryConsume(String key, int limit) {
        Long count = redisTemplate.opsForValue().increment(key);
        applyTtlOnFirstIncrement(key, count);
        return count != null && count <= limit;
    }

    private int currentCount(String key) {
        String value = redisTemplate.opsForValue().get(key);
        return value == null ? 0 : Integer.parseInt(value);
    }

    private void applyTtlOnFirstIncrement(String key, Long count) {
        if (count != null && count == 1L) {
            redisTemplate.expire(key, COUNTER_TTL);
        }
    }

    private String today() {
        return LocalDate.now().toString();
    }
}
