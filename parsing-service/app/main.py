import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.consumer import InvoiceParsingConsumer
from app.extraction.gemini_adapter import GeminiExtractionAdapter
from app.storage.minio_client import MinioFileStore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    extraction_port = GeminiExtractionAdapter(settings.gemini_api_key, settings.gemini_model)
    file_store = MinioFileStore(
        settings.minio_url, settings.minio_access_key, settings.minio_secret_key, settings.minio_bucket
    )
    consumer = InvoiceParsingConsumer(settings, extraction_port, file_store)

    await consumer.start()
    logger.info("parsing-service ready, consuming from parse.q")

    yield

    await consumer.stop()


app = FastAPI(title="parsing-service", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "UP"}
