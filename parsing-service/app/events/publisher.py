import aio_pika
from aio_pika import ExchangeType

from app.events.models import INVOICE_PARSED_TYPE, InvoiceParsed

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
