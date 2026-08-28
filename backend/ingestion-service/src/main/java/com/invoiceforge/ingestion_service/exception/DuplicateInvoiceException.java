package com.invoiceforge.ingestion_service.exception;

public class DuplicateInvoiceException extends RuntimeException {

    public DuplicateInvoiceException(String message) {
        super(message);
    }
}
