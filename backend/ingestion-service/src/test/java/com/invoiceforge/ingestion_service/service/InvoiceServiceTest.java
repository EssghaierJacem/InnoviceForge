package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.exception.QuotaExceededException;
import com.invoiceforge.ingestion_service.exception.SizeCapExceededException;
import com.invoiceforge.ingestion_service.exception.UnsupportedFileTypeException;
import com.invoiceforge.ingestion_service.model.Invoice;
import com.invoiceforge.ingestion_service.model.TenantPlan;
import com.invoiceforge.ingestion_service.port.QuotaPort;
import com.invoiceforge.ingestion_service.port.StoragePort;
import com.invoiceforge.ingestion_service.repository.InvoiceRepository;
import com.invoiceforge.ingestion_service.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Covers the parts of the upload path that are easy to silently break:
 * quota is enforced before anything touches storage, PRO tenants skip the
 * check entirely, files are typed by magic bytes rather than trusted
 * extensions, and duplicate uploads get disambiguated rather than
 * colliding.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;
    private static final byte[] PDF_BYTES = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private OutboxEventRepository outboxEventRepository;
    @Mock
    private StoragePort storagePort;
    @Mock
    private QuotaPort quotaPort;
    @Mock
    private PlanService planService;

    private InvoiceService invoiceService;

    @BeforeEach
    void setUp() {
        invoiceService = new InvoiceService(
                invoiceRepository, outboxEventRepository, storagePort, quotaPort, planService,
                JsonMapper.builder().build(), MAX_SIZE_BYTES
        );
        // Not every test reaches save() (several assert an early rejection
        // instead) — lenient so those don't fail on an unused stub.
        lenient().when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void rejectsUploadWhenFreeTenantHasNoQuotaLeft() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(quotaPort.tryConsumeDailyQuota("tenant-a")).thenReturn(false);

        assertThatThrownBy(() -> invoiceService.upload(PDF_BYTES, "invoice.pdf", USER_ID, "tenant-a"))
                .isInstanceOf(QuotaExceededException.class);

        // The quota gate has to run before anything else — an over-quota
        // upload should never reach storage.
        verifyNoInteractions(storagePort);
    }

    @Test
    void proTenantsNeverConsultQuotaAtAll() {
        when(planService.getPlan("tenant-pro")).thenReturn(TenantPlan.Plan.PRO);
        when(invoiceRepository.countByFileHashAndUserId(anyString(), any())).thenReturn(0L);

        invoiceService.upload(PDF_BYTES, "invoice.pdf", USER_ID, "tenant-pro");

        verify(quotaPort, never()).tryConsumeDailyQuota(anyString());
    }

    @Test
    void succeedsAndPublishesAnOutboxEventWhenQuotaIsAvailable() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(quotaPort.tryConsumeDailyQuota("tenant-a")).thenReturn(true);
        when(invoiceRepository.countByFileHashAndUserId(anyString(), any())).thenReturn(0L);

        Invoice result = invoiceService.upload(PDF_BYTES, "invoice.pdf", USER_ID, "tenant-a");

        assertThat(result.getStatus()).isEqualTo("PENDING");
        verify(storagePort).store(anyString(), any(), eq((long) PDF_BYTES.length), eq("application/pdf"));
        verify(outboxEventRepository).save(any());
    }

    @Test
    void rejectsAnonymousUploadOverTheAnonymousLimit() {
        when(quotaPort.tryConsumeAnonymousQuota("9.9.9.9")).thenReturn(false);

        assertThatThrownBy(() -> invoiceService.uploadAnonymous("9.9.9.9", PDF_BYTES, "invoice.pdf"))
                .isInstanceOf(QuotaExceededException.class);
    }

    @Test
    void rejectsFilesThatDontMatchAKnownMagicByteSignature() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(quotaPort.tryConsumeDailyQuota("tenant-a")).thenReturn(true);
        byte[] notARealFile = {0x00, 0x01, 0x02, 0x03};

        // Renaming a .txt to .pdf doesn't fool this — detection reads the
        // actual bytes, not the filename's extension.
        assertThatThrownBy(() -> invoiceService.upload(notARealFile, "totally-a-pdf.pdf", USER_ID, "tenant-a"))
                .isInstanceOf(UnsupportedFileTypeException.class);
    }

    @Test
    void rejectsFilesOverTheConfiguredSizeCap() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(quotaPort.tryConsumeDailyQuota("tenant-a")).thenReturn(true);
        byte[] tooBig = new byte[(int) MAX_SIZE_BYTES + 1];

        assertThatThrownBy(() -> invoiceService.upload(tooBig, "huge.pdf", USER_ID, "tenant-a"))
                .isInstanceOf(SizeCapExceededException.class);
    }

    @Test
    void appendsACounterToTheFilenameOnAPriorDuplicate() {
        when(planService.getPlan("tenant-a")).thenReturn(TenantPlan.Plan.FREE);
        when(quotaPort.tryConsumeDailyQuota("tenant-a")).thenReturn(true);
        when(invoiceRepository.countByFileHashAndUserId(anyString(), any())).thenReturn(2L);

        invoiceService.upload(PDF_BYTES, "invoice.pdf", USER_ID, "tenant-a");

        verify(storagePort).store(anyString(), any(), anyLong(), anyString());
        verify(invoiceRepository).save(argThat(invoice -> invoice.getOriginalFilename().equals("invoice (2).pdf")));
    }
}
