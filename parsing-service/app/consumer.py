import logging

import aio_pika
from aio_pika.abc import AbstractIncomingMessage

from app.config import Settings
from app.confidence import status_for_score
from app.events.models import InvoiceParsed, InvoiceUploaded
from app.events.publisher import EventPublisher
from app.extraction.port import ExtractionPort
from app.storage.minio_client import MinioFileStore

logger = logging.getLogger(__name__)

PARSE_QUEUE = "parse.q"

RETRY_EXCHANGE = "invoice.retry"
RETRY_LADDER = ["retry.5s", "retry.30s", "retry.2m"]
DLQ_ROUTING_KEY = "dlq"
RETRY_ATTEMPT_HEADER = "x-retry-attempt"


class InvoiceParsingConsumer:
    def __init__(
        self,
        settings: Settings,
        extraction_port: ExtractionPort,
        file_store: MinioFileStore,
    ):
        self._settings = settings
        self._extraction_port = extraction_port
        self._file_store = file_store
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._publisher: EventPublisher | None = None
        self._retry_exchange: aio_pika.abc.AbstractExchange | None = None

    async def start(self) -> None:
        self._connection = await aio_pika.connect_robust(
            host=self._settings.rabbitmq_host,
            port=self._settings.rabbitmq_port,
        )
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=1)

        self._publisher = EventPublisher(channel)
        await self._publisher.start()

        self._retry_exchange = await channel.declare_exchange(
            RETRY_EXCHANGE, aio_pika.ExchangeType.DIRECT, durable=True, passive=True
        )

        queue = await channel.declare_queue(PARSE_QUEUE, durable=True, passive=True)
        await queue.consume(self._handle_message)
        logger.info("Consuming from %s", PARSE_QUEUE)

    async def stop(self) -> None:
        if self._connection is not None:
            await self._connection.close()

    async def _handle_message(self, message: AbstractIncomingMessage) -> None:
        try:
            event = InvoiceUploaded.model_validate_json(message.body)
            await self._process_event(event)
        except Exception:
            logger.exception("Failed to process invoice, routing to retry ladder")
            await self._route_to_retry_ladder(message)
        await message.ack()

    async def _process_event(self, event: InvoiceUploaded) -> None:
        file_bytes, mime_type = await self._file_store.fetch(event.file_key)
        extraction = await self._extraction_port.extract(file_bytes, mime_type)
        status = status_for_score(extraction.confidence_score, self._settings.confidence_threshold)

        parsed = InvoiceParsed.from_extraction(event.invoice_id, event.tenant_id, extraction, status)
        await self._publisher.publish_invoice_parsed(parsed)

    async def _route_to_retry_ladder(self, message: AbstractIncomingMessage) -> None:
        attempt = int((message.headers or {}).get(RETRY_ATTEMPT_HEADER, 0))
        routing_key = RETRY_LADDER[attempt] if attempt < len(RETRY_LADDER) else DLQ_ROUTING_KEY

        headers = dict(message.headers or {})
        headers[RETRY_ATTEMPT_HEADER] = attempt + 1

        retry_message = aio_pika.Message(
            body=message.body,
            headers=headers,
            content_type=message.content_type,
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await self._retry_exchange.publish(retry_message, routing_key=routing_key)
