from app.events.models import STATUS_EXTRACTED, STATUS_NEEDS_REVIEW
from app.extraction.models import GeminiRawExtraction

RELATIVE_TOLERANCE = 0.02  
MIN_ABSOLUTE_TOLERANCE = 0.01


def score_confidence(extraction: GeminiRawExtraction) -> float:
    checks = [
        _has_vendor_name(extraction),
        _has_issue_date(extraction),
        _amounts_reconcile(extraction),
    ]
    return sum(checks) / len(checks)


def status_for_score(score: float, threshold: float) -> str:
    return STATUS_EXTRACTED if score >= threshold else STATUS_NEEDS_REVIEW


def _has_vendor_name(extraction: GeminiRawExtraction) -> float:
    return 1.0 if extraction.vendor_name and extraction.vendor_name.strip() else 0.0


def _has_issue_date(extraction: GeminiRawExtraction) -> float:
    return 1.0 if extraction.issue_date is not None else 0.0


def _amounts_reconcile(extraction: GeminiRawExtraction) -> float:
    total, tax, subtotal = extraction.total_amount, extraction.tax_amount, _line_items_subtotal(extraction)
    unreconcilable = None in (total, tax, subtotal)
    tolerance = max(abs(total or 0) * RELATIVE_TOLERANCE, MIN_ABSOLUTE_TOLERANCE)
    return 1.0 if unreconcilable or abs(total - (subtotal + tax)) <= tolerance else 0.0


def _line_items_subtotal(extraction: GeminiRawExtraction) -> float | None:
    amounts = [item.amount for item in extraction.line_items if item.amount is not None]
    return sum(amounts) if amounts else None
