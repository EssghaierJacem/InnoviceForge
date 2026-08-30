package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import com.invoiceforge.analytics_service.repository.ProcessedEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * This is the consumer that turns a permanently-failed extraction into a
 * row the dashboard can actually show, instead of the invoice just never
 * appearing — see parsing-service's consumer.py for the publishing side.
 * Same idempotency shape as InvoiceParsedConsumer, and worth pinning down
 * separately since it writes a materially different row (a FAILED status
 * with every extracted field left null).
 */
@ExtendWith(MockitoExtension.class)
class InvoiceFailedConsumerTest {

    @Mock
    private ExtractedInvoiceRepository extractedInvoiceRepository;
    @Mock
    private ProcessedEventRepository processedEventRepository;

    private InvoiceFailedConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new InvoiceFailedConsumer(
                JsonMapper.builder().build(), extractedInvoiceRepository, processedEventRepository
        );
    }

    @Test
    void persistsAFailedRowWithNoExtractedFieldsOnFirstDelivery() {
        UUID eventId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        when(processedEventRepository.existsById(eventId)).thenReturn(false);

        consumer.onInvoiceFailed(failedMessage(eventId, invoiceId));

        ArgumentCaptor<ExtractedInvoice> captor = ArgumentCaptor.forClass(ExtractedInvoice.class);
        verify(extractedInvoiceRepository).save(captor.capture());
        ExtractedInvoice saved = captor.getValue();
        assertThat(saved.getInvoiceId()).isEqualTo(invoiceId);
        assertThat(saved.getTenantId()).isEqualTo("tenant-a");
        assertThat(saved.getStatus()).isEqualTo("FAILED");
        assertThat(saved.getVendorName()).isNull();
        assertThat(saved.getConfidenceScore()).isNull();
        verify(processedEventRepository).save(any());
    }

    @Test
    void skipsPersistenceOnARedeliveredFailureEvent() {
        UUID eventId = UUID.randomUUID();
        when(processedEventRepository.existsById(eventId)).thenReturn(true);

        consumer.onInvoiceFailed(failedMessage(eventId, UUID.randomUUID()));

        verify(extractedInvoiceRepository, never()).save(any());
        verify(processedEventRepository, never()).save(any());
    }

    private Message failedMessage(UUID eventId, UUID invoiceId) {
        String json = """
                {"invoiceId":"%s","tenantId":"tenant-a","reason":"Extraction failed after 3 attempts"}
                """.formatted(invoiceId);
        MessageProperties properties = new MessageProperties();
        properties.setMessageId(eventId.toString());
        return new Message(json.getBytes(), properties);
    }
}
