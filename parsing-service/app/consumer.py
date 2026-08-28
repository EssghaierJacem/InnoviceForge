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

    async def start(self) -> None:
        self._connection = await aio_pika.connect_robust(
            host=self._settings.rabbitmq_host,
            port=self._settings.rabbitmq_port,
        )
        channel = await self._connection.channel()
        await channel.set_qos(prefetch_count=1)

        self._publisher = EventPublisher(channel)
        await self._publisher.start()

        queue = await channel.declare_queue(PARSE_QUEUE, durable=True, passive=True)
        await queue.consume(self._handle_message)
        logger.info("Consuming from %s", PARSE_QUEUE)

    async def stop(self) -> None:
        if self._connection is not None:
            await self._connection.close()

    async def _handle_message(self, message: AbstractIncomingMessage) -> None:
        async with message.process(requeue=False):  # nack -> parse.q's DLX -> retry ladder
            event = InvoiceUploaded.model_validate_json(message.body)
            await self._process_event(event)

    async def _process_event(self, event: InvoiceUploaded) -> None:
        file_bytes, mime_type = await self._file_store.fetch(event.file_key)
        extraction = await self._extraction_port.extract(file_bytes, mime_type)
        status = status_for_score(extraction.confidence_score, self._settings.confidence_threshold)

        parsed = InvoiceParsed.from_extraction(event.invoice_id, event.tenant_id, extraction, status)
        await self._publisher.publish_invoice_parsed(parsed)
