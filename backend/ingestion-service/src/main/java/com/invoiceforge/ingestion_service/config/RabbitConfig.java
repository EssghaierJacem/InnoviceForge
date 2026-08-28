package com.invoiceforge.ingestion_service.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String INVOICE_EVENTS_EXCHANGE = "invoice.events";

    @Bean
    public TopicExchange invoiceEventsExchange() {
        return new TopicExchange(INVOICE_EVENTS_EXCHANGE);
    }
}
