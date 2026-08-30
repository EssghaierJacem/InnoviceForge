package com.invoiceforge.ingestion_service.adapter.quota;

import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.port.QuotaStatus;
import com.invoiceforge.ingestion_service.service.PlanService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers the two things that actually matter about this class: that
 * checking a slot (GET) never has the side effect of consuming one, that
 * consuming a slot (INCR) is what enforces the limit, and that the TTL is
 * only ever set once per key rather than refreshed on every request (which
 * would make the counter never expire).
 */
@ExtendWith(MockitoExtension.class)
class RedisQuotaAdapterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private PlanService planService;

    private RedisQuotaAdapter adapter;

    @BeforeEach
    void setUp() {
        adapter = new RedisQuotaAdapter(redisTemplate, planService);
    }

    @Test
    void consumesDailyQuotaWhenUnderLimit() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(3L);

        assertThat(adapter.tryConsumeDailyQuota("tenant-a")).isTrue();
    }

    @Test
    void rejectsDailyQuotaOnceOverLimit() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(6L);

        assertThat(adapter.tryConsumeDailyQuota("tenant-a")).isFalse();
    }

    @Test
    void rejectsAnonymousQuotaOverItsOwnLowerLimit() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(4L);

        // 4 is under the daily (5) limit but over the anonymous (3) one —
        // this is what actually distinguishes the two quota kinds.
        assertThat(adapter.tryConsumeAnonymousQuota("1.2.3.4")).isFalse();
    }

    @Test
    void setsTtlOnlyOnTheFirstIncrement() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);

        adapter.tryConsumeDailyQuota("tenant-a");

        // Verified through RedisOperations, not the mock's concrete
        // StringRedisTemplate type — RedisTemplate separately overloads
        // expire(K, Expiration), which makes this call ambiguous to javac
        // when matchers are involved at the wider type.
        verify((RedisOperations<String, String>) redisTemplate).expire(anyString(), eq(Duration.ofHours(26)));
    }

    @Test
    void doesNotRefreshTtlOnSubsequentIncrements() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(2L);

        adapter.tryConsumeDailyQuota("tenant-a");

        verify((RedisOperations<String, String>) redisTemplate, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void statusReadIsAGetNotAnIncrement() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("2");

        QuotaStatus status = adapter.getStatus("tenant-a");

        assertThat(status.used()).isEqualTo(2);
        assertThat(status.remaining()).isEqualTo(3);
        assertThat(status.dailyLimit()).isEqualTo(5);
        verify(valueOperations, never()).increment(anyString());
    }

    @Test
    void statusDefaultsToZeroUsedWhenTheKeyDoesNotExistYet() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn(null);

        QuotaStatus status = adapter.getStatus("tenant-a");

        assertThat(status.used()).isZero();
        assertThat(status.remaining()).isEqualTo(5);
    }

    @Test
    void proPlanIsUnlimitedAndNeverTouchesRedis() {
        when(planService.getPlan("tenant-pro")).thenReturn(TenantPlan.Plan.PRO);

        QuotaStatus status = adapter.getStatus("tenant-pro");

        assertThat(status.dailyLimit()).isEqualTo(QuotaStatus.UNLIMITED);
        assertThat(status.used()).isEqualTo(QuotaStatus.UNLIMITED);
        assertThat(status.remaining()).isEqualTo(QuotaStatus.UNLIMITED);
        verifyNoInteractions(redisTemplate);
    }
}
