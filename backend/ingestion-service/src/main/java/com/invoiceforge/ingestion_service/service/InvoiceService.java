package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.exception.QuotaExceededException;
import com.invoiceforge.ingestion_service.exception.SizeCapExceededException;
import com.invoiceforge.ingestion_service.exception.UnsupportedFileTypeException;
import com.invoiceforge.ingestion_service.model.Invoice;
import com.invoiceforge.ingestion_service.model.OutboxEvent;
import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.port.QuotaPort;
import com.invoiceforge.ingestion_service.port.StoragePort;
import com.invoiceforge.ingestion_service.repository.InvoiceRepository;
import com.invoiceforge.ingestion_service.repository.OutboxEventRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class InvoiceService {

    private static final byte[] PDF_MAGIC = {0x25, 0x50, 0x44, 0x46};
    private static final byte[] PNG_MAGIC = {(byte) 0x89, 0x50};
    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8};

    private static final List<Map.Entry<byte[], String>> MAGIC_SIGNATURES = List.of(
            Map.entry(PDF_MAGIC, "application/pdf"),
            Map.entry(PNG_MAGIC, "image/png"),
            Map.entry(JPEG_MAGIC, "image/jpeg")
    );

    private final InvoiceRepository invoiceRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final StoragePort storagePort;
    private final QuotaPort quotaPort;
    private final PlanService planService;
    private final ObjectMapper objectMapper;
    private final long maxSizeBytes;

    public InvoiceService(
            InvoiceRepository invoiceRepository,
            OutboxEventRepository outboxEventRepository,
            StoragePort storagePort,
            QuotaPort quotaPort,
            PlanService planService,
            ObjectMapper objectMapper,
            @Value("${upload.max-size-bytes}") long maxSizeBytes
    ) {
        this.invoiceRepository = invoiceRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.storagePort = storagePort;
        this.quotaPort = quotaPort;
        this.planService = planService;
        this.objectMapper = objectMapper;
        this.maxSizeBytes = maxSizeBytes;
    }

    @Transactional
    public Invoice upload(byte[] content, String originalFilename, UUID userId, String tenantId) {
        enforceDailyQuota(tenantId);
        return performUpload(content, originalFilename, userId, tenantId);
    }

    @Transactional
    public Invoice uploadAnonymous(String ipAddress, byte[] content, String originalFilename) {
        enforceAnonymousQuota(ipAddress);
        UUID userId = UUID.nameUUIDFromBytes(ipAddress.getBytes());
        return performUpload(content, originalFilename, userId, "anon:" + ipAddress);
    }

    private void enforceDailyQuota(String tenantId) {
        Optional.of(tenantId)
                .filter(id -> planService.getPlan(id) != TenantPlan.Plan.PRO)
                .filter(id -> !quotaPort.tryConsumeDailyQuota(id))
                .ifPresent(id -> {
                    throw new QuotaExceededException("Daily upload limit reached (5/day on Free plan)");
                });
    }

    private void enforceAnonymousQuota(String ipAddress) {
        Optional.of(ipAddress)
                .filter(ip -> !quotaPort.tryConsumeAnonymousQuota(ip))
                .ifPresent(ip -> {
                    throw new QuotaExceededException("Daily anonymous upload limit reached");
                });
    }

    private Invoice performUpload(byte[] content, String originalFilename, UUID userId, String tenantId) {
        validateSize(content);
        String mimeType = detectMimeType(content);
        String fileHash = sha256Hex(content);
        String resolvedFilename = disambiguateFilename(originalFilename, fileHash, userId);

        UUID invoiceId = UUID.randomUUID();
        String fileKey = buildFileKey(tenantId, userId, invoiceId);

        storagePort.store(fileKey, new ByteArrayInputStream(content), content.length, mimeType);

        Invoice invoice = invoiceRepository.save(
                buildInvoice(invoiceId, tenantId, userId, fileKey, fileHash, resolvedFilename, mimeType, content.length)
        );
        outboxEventRepository.save(buildOutboxEvent(invoiceId, tenantId, userId, fileKey));
        // invoiceId is the correlation key that threads through the outbox
        // publish, RabbitMQ, parsing-service, and analytics-service's own
        // logs — this is the one line on the ingestion side that anchors it.
        log.info("[invoice_id={}] uploaded ({} bytes), outbox event queued for publish", invoiceId, content.length);

        return invoice;
    }

    private void validateSize(byte[] content) {
        Optional.of(content)
                .filter(c -> c.length > maxSizeBytes)
                .ifPresent(c -> {
                    throw new SizeCapExceededException("File exceeds maximum allowed size of " + maxSizeBytes + " bytes");
                });
    }

    private String disambiguateFilename(String originalFilename, String fileHash, UUID userId) {
        long duplicateCount = invoiceRepository.countByFileHashAndUserId(fileHash, userId);
        return duplicateCount == 0 ? originalFilename : appendCounter(originalFilename, duplicateCount);
    }

    private String appendCounter(String filename, long counter) {
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex == -1
                ? filename + " (" + counter + ")"
                : filename.substring(0, dotIndex) + " (" + counter + ")" + filename.substring(dotIndex);
    }

    private String detectMimeType(byte[] content) {
        return MAGIC_SIGNATURES.stream()
                .filter(entry -> startsWith(content, entry.getKey()))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElseThrow(() -> new UnsupportedFileTypeException("Unsupported file type: unrecognized file signature"));
    }

    private boolean startsWith(byte[] content, byte[] magic) {
        return content.length >= magic.length
                && Arrays.equals(Arrays.copyOfRange(content, 0, magic.length), magic);
    }

    private String sha256Hex(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    private String buildFileKey(String tenantId, UUID userId, UUID invoiceId) {
        return tenantId + "/" + userId + "/" + invoiceId;
    }

    private Invoice buildInvoice(UUID invoiceId, String tenantId, UUID userId, String fileKey, String fileHash,
                                  String originalFilename, String mimeType, long sizeBytes) {
        return new Invoice(invoiceId, tenantId, userId, fileKey, fileHash, originalFilename, mimeType, sizeBytes, "PENDING");
    }

    private OutboxEvent buildOutboxEvent(UUID invoiceId, String tenantId, UUID userId, String fileKey) {
        return new OutboxEvent(
                UUID.randomUUID(), tenantId, invoiceId, "INVOICE_UPLOADED",
                objectMapper.writeValueAsString(new InvoiceUploadedPayload(invoiceId, tenantId, userId, fileKey))
        );
    }

    private record InvoiceUploadedPayload(UUID invoiceId, String tenantId, UUID userId, String fileKey) {
    }
}
