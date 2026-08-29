from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.extraction.models import ExtractionResult, LineItem

INVOICE_UPLOADED_TYPE = "INVOICE_UPLOADED"
INVOICE_PARSED_TYPE = "INVOICE_PARSED"

STATUS_EXTRACTED = "EXTRACTED"
STATUS_NEEDS_REVIEW = "NEEDS_REVIEW"


class InvoiceUploaded(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    invoice_id: UUID = Field(alias="invoiceId")
    tenant_id: str = Field(alias="tenantId")
    user_id: UUID = Field(alias="userId")
    file_key: str = Field(alias="fileKey")


class InvoiceParsed(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    invoice_id: UUID = Field(alias="invoiceId")
    tenant_id: str = Field(alias="tenantId")
    status: str
    vendor_name: str | None = Field(default=None, alias="vendorName")
    invoice_number: str | None = Field(default=None, alias="invoiceNumber")
    issue_date: date | None = Field(default=None, alias="issueDate")
    currency: str | None = None
    total_amount: float | None = Field(default=None, alias="totalAmount")
    tax_amount: float | None = Field(default=None, alias="taxAmount")
    line_items: list[LineItem] = Field(default_factory=list, alias="lineItems")
    category: str | None = None
    confidence_score: float = Field(alias="confidenceScore")

    @classmethod
    def from_extraction(
        cls,
        invoice_id: UUID,
        tenant_id: str,
        extraction: ExtractionResult,
        status: str,
    ) -> "InvoiceParsed":
        return cls(
            invoice_id=invoice_id,
            tenant_id=tenant_id,
            status=status,
            vendor_name=extraction.vendor_name,
            invoice_number=extraction.invoice_number,
            issue_date=extraction.issue_date,
            currency=extraction.currency,
            total_amount=extraction.total_amount,
            tax_amount=extraction.tax_amount,
            line_items=extraction.line_items,
            category=extraction.category,
            confidence_score=extraction.confidence_score,
        )
