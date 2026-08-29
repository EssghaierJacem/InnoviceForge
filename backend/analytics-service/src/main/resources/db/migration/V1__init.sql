CREATE TABLE extracted_invoices (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100),
    issue_date DATE,
    currency CHAR(3),
    total_amount NUMERIC(12,2),
    tax_amount NUMERIC(12,2),
    category VARCHAR(50),
    line_items JSONB,
    confidence_score NUMERIC(3,2),
    status VARCHAR(20) NOT NULL,
    reviewed_by_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_extracted_invoices_tenant_id ON extracted_invoices (tenant_id);
CREATE INDEX idx_extracted_invoices_invoice_id ON extracted_invoices (invoice_id);

CREATE TABLE processed_events (
    event_id UUID PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);
