package com.invoiceforge.ingestion_service.adapter.quota;

import com.invoiceforge.ingestion_service.port.QuotaPort;
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

    public RedisQuotaAdapter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean tryConsumeDailyQuota(String tenantId) {
        return tryConsume("usage:daily:" + tenantId + ":" + today(), DAILY_LIMIT);
    }

    @Override
    public boolean tryConsumeAnonymousQuota(String ipAddress) {
        return tryConsume("usage:anon:" + ipAddress + ":" + today(), ANONYMOUS_LIMIT);
    }

    private boolean tryConsume(String key, int limit) {
        Long count = redisTemplate.opsForValue().increment(key);
        applyTtlOnFirstIncrement(key, count);
        return count != null && count <= limit;
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
