CREATE TABLE tenant_plan (
    tenant_id VARCHAR(64) PRIMARY KEY,
    plan VARCHAR(20) NOT NULL DEFAULT 'FREE',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
