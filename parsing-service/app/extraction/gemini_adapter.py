import json

from google import genai
from google.genai import types

from app.confidence import score_confidence
from app.extraction.models import ExtractionResult, GeminiRawExtraction
from app.extraction.port import ExtractionPort

EXTRACTION_PROMPT = (
    "You are an invoice data extraction system. Read the attached document "
    "and extract these fields as structured JSON: vendor_name, "
    "invoice_number, issue_date (ISO 8601, YYYY-MM-DD), currency (ISO 4217 "
    "code), total_amount, tax_amount, line_items (each with description, "
    "quantity, unit_price, amount), and category (a short free-text "
    "classification of what was purchased, e.g. 'software', 'travel', "
    "'office supplies'). If a field is not present in the document, return "
    "null for it rather than guessing."
)


class GeminiExtractionAdapter(ExtractionPort):
    def __init__(self, api_key: str, model: str):
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def extract(self, file_bytes: bytes, mime_type: str) -> ExtractionResult:
        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=[
                EXTRACTION_PROMPT,
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiRawExtraction,
            ),
        )

        if not response.text:
            raise ValueError("Gemini returned an empty response")

        raw = GeminiRawExtraction.model_validate(json.loads(response.text))
        confidence = score_confidence(raw)

        return ExtractionResult(**raw.model_dump(), confidence_score=confidence)
