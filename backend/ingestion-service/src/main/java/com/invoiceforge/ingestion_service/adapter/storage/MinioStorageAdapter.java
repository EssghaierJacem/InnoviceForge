package com.invoiceforge.ingestion_service.adapter.storage;

import com.invoiceforge.ingestion_service.port.StorageException;
import com.invoiceforge.ingestion_service.port.StoragePort;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class MinioStorageAdapter implements StoragePort {

    private final MinioClient minioClient;
    private final String bucket;

    public MinioStorageAdapter(
            @Value("${storage.minio.url}") String url,
            @Value("${storage.minio.access-key}") String accessKey,
            @Value("${storage.minio.secret-key}") String secretKey,
            @Value("${storage.minio.bucket}") String bucket
    ) {
        this.minioClient = MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey)
                .build();
        this.bucket = bucket;
    }

    @PostConstruct
    public void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new StorageException("Failed to ensure MinIO bucket exists: " + bucket, e);
        }
    }

    @Override
    public void store(String fileKey, InputStream content, long size, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(fileKey)
                    .stream(content, size, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to store file: " + fileKey, e);
        }
    }
}
