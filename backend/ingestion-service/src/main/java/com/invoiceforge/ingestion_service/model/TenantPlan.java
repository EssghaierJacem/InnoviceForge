package com.invoiceforge.ingestion_service.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "tenant_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TenantPlan {

    public enum Plan {
        FREE, PRO
    }

    @Id
    @Column(name = "tenant_id", length = 64)
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false, length = 20)
    private Plan plan;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public TenantPlan(String tenantId, Plan plan) {
        this.tenantId = tenantId;
        this.plan = plan;
    }
}
