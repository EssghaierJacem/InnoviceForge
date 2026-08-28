CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL,
    file_key VARCHAR(512) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_tenant_id ON invoices (tenant_id);

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_events_unpublished ON outbox_events (created_at)
    WHERE published_at IS NULL;

CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
