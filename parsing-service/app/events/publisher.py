import uuid

import aio_pika
from aio_pika import ExchangeType

from app.events.models import INVOICE_FAILED_TYPE, INVOICE_PARSED_TYPE, InvoiceFailed, InvoiceParsed

INVOICE_EVENTS_EXCHANGE = "invoice.events"


class EventPublisher:
    def __init__(self, channel: aio_pika.abc.AbstractChannel):
        self._channel = channel
        self._exchange: aio_pika.abc.AbstractExchange | None = None

    async def start(self) -> None:
        self._exchange = await self._channel.declare_exchange(
            INVOICE_EVENTS_EXCHANGE, ExchangeType.TOPIC, durable=True, passive=True
        )

    async def publish_invoice_parsed(self, event: InvoiceParsed) -> None:
        if self._exchange is None:
            raise RuntimeError("EventPublisher.start() must be called before publishing")

        message = aio_pika.Message(
            body=event.model_dump_json(by_alias=True).encode("utf-8"),
            content_type="application/json",
            message_id=str(event.invoice_id),
        )
        await self._exchange.publish(message, routing_key=INVOICE_PARSED_TYPE)

    async def publish_invoice_failed(self, event: InvoiceFailed) -> None:
        if self._exchange is None:
            raise RuntimeError("EventPublisher.start() must be called before publishing")

        message = aio_pika.Message(
            body=event.model_dump_json(by_alias=True).encode("utf-8"),
            content_type="application/json",
            # A fresh id, not the invoice id — a message id doubles as the
            # idempotency key on the consuming side (see ProcessedEvent),
            # and publish_invoice_parsed already claims invoice_id for that
            # role on INVOICE_PARSED; reusing it here would let a parsed and
            # a failed event for the same invoice collide on the same key.
            message_id=str(uuid.uuid4()),
        )
        await self._exchange.publish(message, routing_key=INVOICE_FAILED_TYPE)
