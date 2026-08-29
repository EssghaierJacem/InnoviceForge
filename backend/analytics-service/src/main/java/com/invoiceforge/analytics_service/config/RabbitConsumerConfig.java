package com.invoiceforge.analytics_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConsumerConfig {

    public static final String INVOICE_EVENTS_EXCHANGE = "invoice.events";
    public static final String INVOICE_PARSED_ROUTING_KEY = "INVOICE_PARSED";
    public static final String INVOICE_PARSED_QUEUE = "analytics.invoice-parsed.q";

    @Bean
    public Queue invoiceParsedQueue() {
        return new Queue(INVOICE_PARSED_QUEUE, true);
    }

    @Bean
    public Binding invoiceParsedBinding(Queue invoiceParsedQueue) {
        TopicExchange invoiceEventsExchange = new TopicExchange(INVOICE_EVENTS_EXCHANGE);
        return BindingBuilder.bind(invoiceParsedQueue).to(invoiceEventsExchange).with(INVOICE_PARSED_ROUTING_KEY);
    }
}
