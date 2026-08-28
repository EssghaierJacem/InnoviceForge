from datetime import date

import pytest

from app.confidence import score_confidence, status_for_score
from app.events.models import STATUS_EXTRACTED, STATUS_NEEDS_REVIEW
from app.extraction.models import GeminiRawExtraction, LineItem


def _extraction(**overrides) -> GeminiRawExtraction:
    defaults = dict(
        vendor_name="Acme Corp",
        invoice_number="INV-001",
        issue_date=date(2026, 1, 15),
        currency="USD",
        total_amount=110.0,
        tax_amount=10.0,
        line_items=[LineItem(description="Widget", quantity=1, unit_price=100.0, amount=100.0)],
        category="software",
    )
    defaults.update(overrides)
    return GeminiRawExtraction(**defaults)


def test_full_confidence_when_all_checks_pass():
    assert score_confidence(_extraction()) == 1.0


def test_missing_vendor_name_lowers_score():
    assert score_confidence(_extraction(vendor_name=None)) == pytest.approx(2 / 3)


def test_blank_vendor_name_counts_as_missing():
    assert score_confidence(_extraction(vendor_name="   ")) == pytest.approx(2 / 3)


def test_missing_issue_date_lowers_score():
    assert score_confidence(_extraction(issue_date=None)) == pytest.approx(2 / 3)


def test_amount_mismatch_lowers_score():
    assert score_confidence(_extraction(total_amount=999.0)) == pytest.approx(2 / 3)


def test_missing_amounts_does_not_penalize():
    assert score_confidence(_extraction(total_amount=None, tax_amount=None)) == 1.0


def test_no_line_items_does_not_penalize_amount_check():
    assert score_confidence(_extraction(line_items=[])) == 1.0


def test_status_for_score_uses_threshold_inclusively():
    assert status_for_score(0.6, threshold=0.6) == STATUS_EXTRACTED
    assert status_for_score(0.59, threshold=0.6) == STATUS_NEEDS_REVIEW
