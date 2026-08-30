package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.config.RabbitConsumerConfig;
import com.invoiceforge.analytics_service.dto.InvoiceFailedMessage;
import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.model.ProcessedEvent;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import com.invoiceforge.analytics_service.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.MDC;

import java.util.UUID;

/**
 * Consumes the domain-level INVOICE_FAILED event parsing-service publishes
 * once an invoice has exhausted the retry ladder (see its consumer.py) and
 * been dead-lettered to invoice.parse.dlq. That queue holds the raw message
 * for replay/inspection, but nothing was consuming it or turning a
 * permanent failure into anything a user could see — this persists a
 * visible FAILED row instead of the invoice just silently never appearing
 * in the dashboard.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceFailedConsumer {

    private static final String FAILED_STATUS = "FAILED";

    private final ObjectMapper objectMapper;
    private final ExtractedInvoiceRepository extractedInvoiceRepository;
    private final ProcessedEventRepository processedEventRepository;

    @RabbitListener(queues = RabbitConsumerConfig.INVOICE_FAILED_QUEUE)
    @Transactional
    public void onInvoiceFailed(Message message) {
        UUID eventId = UUID.fromString(message.getMessageProperties().getMessageId());
        processIfNotDuplicate(eventId, message.getBody());
    }

    private void processIfNotDuplicate(UUID eventId, byte[] body) {
        if (!processedEventRepository.existsById(eventId)) {
            persist(eventId, objectMapper.readValue(body, InvoiceFailedMessage.class));
        }
    }

    private void persist(UUID eventId, InvoiceFailedMessage message) {
        MDC.put("invoiceId", message.invoiceId().toString());
        try {
            log.warn("Persisting permanently-failed invoice ({}): {}", message.invoiceId(), message.reason());
            extractedInvoiceRepository.save(buildFailedInvoice(message));
            processedEventRepository.save(new ProcessedEvent(eventId));
        } finally {
            MDC.remove("invoiceId");
        }
    }

    private ExtractedInvoice buildFailedInvoice(InvoiceFailedMessage message) {
        return new ExtractedInvoice(
                UUID.randomUUID(),
                message.invoiceId(),
                message.tenantId(),
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null,
                FAILED_STATUS
        );
    }
}
