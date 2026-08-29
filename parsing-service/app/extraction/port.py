from abc import ABC, abstractmethod

from app.extraction.models import ExtractionResult


class ExtractionPort(ABC):
    @abstractmethod
    async def extract(self, file_bytes: bytes, mime_type: str) -> ExtractionResult:
        raise NotImplementedError
