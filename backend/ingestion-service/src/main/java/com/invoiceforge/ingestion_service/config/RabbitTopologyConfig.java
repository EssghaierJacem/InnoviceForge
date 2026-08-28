package com.invoiceforge.ingestion_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitTopologyConfig {

    public static final String PARSE_QUEUE = "parse.q";
    public static final String INVOICE_UPLOADED_ROUTING_KEY = "INVOICE_UPLOADED";

    public static final String RETRY_EXCHANGE = "invoice.retry";
    public static final String RETRY_5S_QUEUE = "retry.5s";
    public static final String RETRY_30S_QUEUE = "retry.30s";
    public static final String RETRY_2M_QUEUE = "retry.2m";
    public static final String DLQ_ROUTING_KEY = "dlq";

    public static final String PARSE_DLQ = "invoice.parse.dlq";

    @Bean
    public Declarables invoiceParsingTopology(TopicExchange invoiceEventsExchange) {
        DirectExchange retryExchange = new DirectExchange(RETRY_EXCHANGE);

        Queue parseQueue = QueueBuilder.durable(PARSE_QUEUE)
                .withArgument("x-dead-letter-exchange", RETRY_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", RETRY_5S_QUEUE)
                .build();

        Queue retry5sQueue = retryQueue(RETRY_5S_QUEUE, 5_000);
        Queue retry30sQueue = retryQueue(RETRY_30S_QUEUE, 30_000);
        Queue retry2mQueue = retryQueue(RETRY_2M_QUEUE, 120_000);

        Queue parseDlq = QueueBuilder.durable(PARSE_DLQ).build();

        Binding parseQueueBinding = BindingBuilder.bind(parseQueue)
                .to(invoiceEventsExchange)
                .with(INVOICE_UPLOADED_ROUTING_KEY);

        Binding retry5sBinding = BindingBuilder.bind(retry5sQueue).to(retryExchange).with(RETRY_5S_QUEUE);
        Binding retry30sBinding = BindingBuilder.bind(retry30sQueue).to(retryExchange).with(RETRY_30S_QUEUE);
        Binding retry2mBinding = BindingBuilder.bind(retry2mQueue).to(retryExchange).with(RETRY_2M_QUEUE);
        Binding parseDlqBinding = BindingBuilder.bind(parseDlq).to(retryExchange).with(DLQ_ROUTING_KEY);

        return new Declarables(
                retryExchange,
                parseQueue, retry5sQueue, retry30sQueue, retry2mQueue, parseDlq,
                parseQueueBinding, retry5sBinding, retry30sBinding, retry2mBinding, parseDlqBinding
        );
    }

    private Queue retryQueue(String name, int ttlMillis) {
        return QueueBuilder.durable(name)
                .withArgument("x-message-ttl", ttlMillis)
                .withArgument("x-dead-letter-exchange", RabbitConfig.INVOICE_EVENTS_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", INVOICE_UPLOADED_ROUTING_KEY)
                .build();
    }
}
