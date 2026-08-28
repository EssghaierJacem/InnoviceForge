package com.invoiceforge.ingestion_service.port;

public class StorageException extends RuntimeException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
