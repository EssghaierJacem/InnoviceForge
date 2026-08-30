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
    public static final String INVOICE_FAILED_ROUTING_KEY = "INVOICE_FAILED";
    public static final String INVOICE_FAILED_QUEUE = "analytics.invoice-failed.q";

    @Bean
    public Queue invoiceParsedQueue() {
        return new Queue(INVOICE_PARSED_QUEUE, true);
    }

    @Bean
    public Binding invoiceParsedBinding(Queue invoiceParsedQueue) {
        TopicExchange invoiceEventsExchange = new TopicExchange(INVOICE_EVENTS_EXCHANGE);
        return BindingBuilder.bind(invoiceParsedQueue).to(invoiceEventsExchange).with(INVOICE_PARSED_ROUTING_KEY);
    }

    @Bean
    public Queue invoiceFailedQueue() {
        return new Queue(INVOICE_FAILED_QUEUE, true);
    }

    @Bean
    public Binding invoiceFailedBinding(Queue invoiceFailedQueue) {
        TopicExchange invoiceEventsExchange = new TopicExchange(INVOICE_EVENTS_EXCHANGE);
        return BindingBuilder.bind(invoiceFailedQueue).to(invoiceEventsExchange).with(INVOICE_FAILED_ROUTING_KEY);
    }
}
