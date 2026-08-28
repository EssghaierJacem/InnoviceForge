package com.invoiceforge.ingestion_service.service;

import com.invoiceforge.ingestion_service.config.RabbitConfig;
import com.invoiceforge.ingestion_service.model.OutboxEvent;
import com.invoiceforge.ingestion_service.repository.OutboxEventRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    public OutboxPublisher(OutboxEventRepository outboxEventRepository, RabbitTemplate rabbitTemplate) {
        this.outboxEventRepository = outboxEventRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Scheduled(fixedDelayString = "${outbox.publish-interval-ms:2000}")
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEvent> pending = outboxEventRepository.findTop100ByPublishedAtIsNullOrderByCreatedAtAsc();
        pending.forEach(this::publish);
    }

    private void publish(OutboxEvent event) {
        rabbitTemplate.convertAndSend(
                RabbitConfig.INVOICE_EVENTS_EXCHANGE,
                event.getType(),
                event.getPayload(),
                message -> {
                    message.getMessageProperties().setMessageId(event.getId().toString());
                    return message;
                }
        );
        event.markPublished(Instant.now());
        outboxEventRepository.save(event);
    }
}
