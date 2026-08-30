from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.extraction.models import ExtractionResult, LineItem

INVOICE_UPLOADED_TYPE = "INVOICE_UPLOADED"
INVOICE_PARSED_TYPE = "INVOICE_PARSED"
INVOICE_FAILED_TYPE = "INVOICE_FAILED"

STATUS_EXTRACTED = "EXTRACTED"
STATUS_NEEDS_REVIEW = "NEEDS_REVIEW"
STATUS_FAILED = "FAILED"


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
    contact_name: str | None = Field(default=None, alias="contactName")
    invoice_number: str | None = Field(default=None, alias="invoiceNumber")
    po_number: str | None = Field(default=None, alias="poNumber")
    issue_date: date | None = Field(default=None, alias="issueDate")
    due_date: date | None = Field(default=None, alias="dueDate")
    currency: str | None = None
    total_amount: float | None = Field(default=None, alias="totalAmount")
    subtotal: float | None = None
    tax_amount: float | None = Field(default=None, alias="taxAmount")
    payment_terms: str | None = Field(default=None, alias="paymentTerms")
    payment_method: str | None = Field(default=None, alias="paymentMethod")
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
            contact_name=extraction.contact_name,
            invoice_number=extraction.invoice_number,
            po_number=extraction.po_number,
            issue_date=extraction.issue_date,
            due_date=extraction.due_date,
            currency=extraction.currency,
            total_amount=extraction.total_amount,
            subtotal=extraction.subtotal,
            tax_amount=extraction.tax_amount,
            payment_terms=extraction.payment_terms,
            payment_method=extraction.payment_method,
            line_items=extraction.line_items,
            category=extraction.category,
            confidence_score=extraction.confidence_score,
        )


class InvoiceFailed(BaseModel):
    """
    Published when an invoice exhausts the retry ladder (see consumer.py) and
    is routed to invoice.parse.dlq for good. The raw AMQP message still lands
    in the DLQ for replay/inspection, but nothing was consuming that queue or
    surfacing the failure anywhere a user or operator would see it — this
    lightweight domain event is what analytics-service turns into a visible
    FAILED row instead of the invoice just silently never appearing.
    """

    model_config = ConfigDict(populate_by_name=True)

    invoice_id: UUID = Field(alias="invoiceId")
    tenant_id: str = Field(alias="tenantId")
    reason: str
