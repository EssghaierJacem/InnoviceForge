package com.invoiceforge.ingestion_service.port;

import java.io.InputStream;

public interface StoragePort {

    void store(String fileKey, InputStream content, long size, String contentType);
}
