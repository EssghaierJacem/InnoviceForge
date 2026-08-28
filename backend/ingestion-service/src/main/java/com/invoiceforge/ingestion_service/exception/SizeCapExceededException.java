package com.invoiceforge.ingestion_service.exception;

public class SizeCapExceededException extends RuntimeException {

    public SizeCapExceededException(String message) {
        super(message);
    }
}
