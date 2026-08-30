package com.invoiceforge.analytics_service.service;

import com.invoiceforge.analytics_service.config.RabbitConsumerConfig;
import com.invoiceforge.analytics_service.dto.InvoiceParsedMessage;
import com.invoiceforge.analytics_service.model.ExtractedInvoice;
import com.invoiceforge.analytics_service.model.ProcessedEvent;
import com.invoiceforge.analytics_service.repository.ExtractedInvoiceRepository;
import com.invoiceforge.analytics_service.repository.ProcessedEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class InvoiceParsedConsumer {

    private final ObjectMapper objectMapper;
    private final ExtractedInvoiceRepository extractedInvoiceRepository;
    private final ProcessedEventRepository processedEventRepository;

    @RabbitListener(queues = RabbitConsumerConfig.INVOICE_PARSED_QUEUE)
    @Transactional
    public void onInvoiceParsed(Message message) {
        UUID eventId = UUID.fromString(message.getMessageProperties().getMessageId());
        processIfNotDuplicate(eventId, message.getBody());
    }

    private void processIfNotDuplicate(UUID eventId, byte[] body) {
        if (!processedEventRepository.existsById(eventId)) {
            persist(eventId, objectMapper.readValue(body, InvoiceParsedMessage.class));
        }
    }

    private void persist(UUID eventId, InvoiceParsedMessage message) {
        // invoiceId is the only id this pipeline threads through every hop
        // (upload → outbox → RabbitMQ → parsing-service → here) — putting
        // it in MDC means every log line below, and any future one added
        // to this method, is greppable across all three services' logs
        // without a real distributed-tracing backend in place.
        MDC.put("invoiceId", message.invoiceId().toString());
        try {
            log.info("[invoice_id={}] InvoiceParsed received, persisting as {}", message.invoiceId(), message.status());
            extractedInvoiceRepository.save(buildExtractedInvoice(message));
            processedEventRepository.save(new ProcessedEvent(eventId));
        } finally {
            MDC.remove("invoiceId");
        }
    }

    private ExtractedInvoice buildExtractedInvoice(InvoiceParsedMessage message) {
        return new ExtractedInvoice(
                UUID.randomUUID(),
                message.invoiceId(),
                message.tenantId(),
                message.vendorName(),
                message.contactName(),
                message.invoiceNumber(),
                message.poNumber(),
                parseDate(message.issueDate()),
                parseDate(message.dueDate()),
                message.currency(),
                message.totalAmount(),
                message.subtotal(),
                message.taxAmount(),
                message.paymentTerms(),
                message.paymentMethod(),
                message.category(),
                toJson(message.lineItems()),
                message.confidenceScore(),
                message.status()
        );
    }

    private LocalDate parseDate(String date) {
        return date == null ? null : LocalDate.parse(date);
    }

    private String toJson(List<Object> lineItems) {
        return objectMapper.writeValueAsString(lineItems);
    }
}
