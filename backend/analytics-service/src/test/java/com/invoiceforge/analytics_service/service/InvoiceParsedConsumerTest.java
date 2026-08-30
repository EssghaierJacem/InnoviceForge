package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.config.RabbitConsumerConfig;
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
 * The whole reason this consumer exists in its current shape is RabbitMQ's
 * at-least-once delivery guarantee — a redelivered INVOICE_PARSED message
 * must never double-insert a result. That idempotency behavior, keyed by
 * the AMQP message id against processed_events, is what these tests pin
 * down; the field-by-field mapping is exercised for real by the running
 * pipeline and isn't worth re-asserting here.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceParsedConsumerTest {

    @Mock
    private ExtractedInvoiceRepository extractedInvoiceRepository;
    @Mock
    private ProcessedEventRepository processedEventRepository;

    private InvoiceParsedConsumer consumer;

    @BeforeEach
    void setUp() {
        consumer = new InvoiceParsedConsumer(
                JsonMapper.builder().build(), extractedInvoiceRepository, processedEventRepository
        );
    }

    @Test
    void persistsAndMarksProcessedOnFirstDelivery() {
        UUID eventId = UUID.randomUUID();
        UUID invoiceId = UUID.randomUUID();
        when(processedEventRepository.existsById(eventId)).thenReturn(false);

        consumer.onInvoiceParsed(parsedMessage(eventId, invoiceId));

        ArgumentCaptor<ExtractedInvoice> captor = ArgumentCaptor.forClass(ExtractedInvoice.class);
        verify(extractedInvoiceRepository).save(captor.capture());
        assertThat(captor.getValue().getInvoiceId()).isEqualTo(invoiceId);
        assertThat(captor.getValue().getStatus()).isEqualTo("EXTRACTED");
        verify(processedEventRepository).save(any());
    }

    @Test
    void skipsPersistenceOnARedeliveredEvent() {
        UUID eventId = UUID.randomUUID();
        when(processedEventRepository.existsById(eventId)).thenReturn(true);

        consumer.onInvoiceParsed(parsedMessage(eventId, UUID.randomUUID()));

        verify(extractedInvoiceRepository, never()).save(any());
        verify(processedEventRepository, never()).save(any());
    }

    private Message parsedMessage(UUID eventId, UUID invoiceId) {
        String json = """
                {"invoiceId":"%s","tenantId":"tenant-a","status":"EXTRACTED","vendorName":"Acme Co",
                 "totalAmount":100.00,"subtotal":90.00,"taxAmount":10.00,"lineItems":[],"confidenceScore":0.95}
                """.formatted(invoiceId);
        MessageProperties properties = new MessageProperties();
        properties.setMessageId(eventId.toString());
        return new Message(json.getBytes(), properties);
    }
}
