import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.extraction.gemini_adapter import GeminiExtractionAdapter

VALID_PAYLOAD = {
    "vendor_name": "Acme Corp",
    "invoice_number": "INV-001",
    "issue_date": "2026-01-15",
    "currency": "USD",
    "total_amount": 110.0,
    "tax_amount": 10.0,
    "line_items": [
        {"description": "Widget", "quantity": 1, "unit_price": 100.0, "amount": 100.0}
    ],
    "category": "software",
}


def _adapter() -> GeminiExtractionAdapter:
    return GeminiExtractionAdapter(api_key="fake-key-for-testing", model="gemini-3.5-flash-lite")


def _mock_response(text: str) -> MagicMock:
    response = MagicMock()
    response.text = text
    return response


@pytest.mark.asyncio
async def test_extract_returns_result_with_computed_confidence():
    adapter = _adapter()
    adapter._client.aio.models.generate_content = AsyncMock(
        return_value=_mock_response(json.dumps(VALID_PAYLOAD))
    )

    result = await adapter.extract(b"%PDF-1.4 fake content", "application/pdf")

    assert result.vendor_name == "Acme Corp"
    assert result.total_amount == 110.0
    assert result.confidence_score == 1.0
    adapter._client.aio.models.generate_content.assert_awaited_once()


@pytest.mark.asyncio
async def test_extract_does_not_swallow_invalid_json():
    adapter = _adapter()
    adapter._client.aio.models.generate_content = AsyncMock(
        return_value=_mock_response("this is not valid json")
    )

    with pytest.raises(json.JSONDecodeError):
        await adapter.extract(b"bytes", "application/pdf")


@pytest.mark.asyncio
async def test_extract_does_not_swallow_empty_response():
    adapter = _adapter()
    adapter._client.aio.models.generate_content = AsyncMock(return_value=_mock_response(""))

    with pytest.raises(ValueError):
        await adapter.extract(b"bytes", "application/pdf")


@pytest.mark.asyncio
async def test_extract_does_not_swallow_api_errors():
    adapter = _adapter()
    adapter._client.aio.models.generate_content = AsyncMock(side_effect=RuntimeError("upstream boom"))

    with pytest.raises(RuntimeError):
        await adapter.extract(b"bytes", "application/pdf")
