ALTER TABLE extracted_invoices
    ADD COLUMN contact_name VARCHAR(255),
    ADD COLUMN po_number VARCHAR(100),
    ADD COLUMN due_date DATE,
    ADD COLUMN subtotal NUMERIC(12,2),
    ADD COLUMN payment_terms VARCHAR(100),
    ADD COLUMN payment_method VARCHAR(100);
