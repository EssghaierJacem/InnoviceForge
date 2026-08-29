from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class LineItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    description: str | None = None
    quantity: float | None = None
    unit_price: float | None = Field(default=None, alias="unitPrice")
    amount: float | None = None


class GeminiRawExtraction(BaseModel):
    vendor_name: str | None = None
    contact_name: str | None = None
    invoice_number: str | None = None
    po_number: str | None = None
    issue_date: date | None = None
    due_date: date | None = None
    currency: str | None = None
    total_amount: float | None = None
    subtotal: float | None = None
    tax_amount: float | None = None
    payment_terms: str | None = None
    payment_method: str | None = None
    line_items: list[LineItem] = Field(default_factory=list)
    category: str | None = None


class ExtractionResult(GeminiRawExtraction):
    confidence_score: float
