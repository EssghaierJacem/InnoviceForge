import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import Settings
from app.consumer import DLQ_ROUTING_KEY, RETRY_ATTEMPT_HEADER, RETRY_LADDER, InvoiceParsingConsumer
from app.events.models import InvoiceFailed


def _consumer() -> InvoiceParsingConsumer:
    settings = Settings(gemini_api_key="fake-key-for-testing")
    consumer = InvoiceParsingConsumer(settings, extraction_port=MagicMock(), file_store=MagicMock())
    # start() opens a real AMQP connection — these two collaborators are
    # what the retry-ladder logic actually touches, so they're substituted
    # directly rather than standing up a broker for a unit test.
    consumer._publisher = MagicMock()
    consumer._publisher.publish_invoice_failed = AsyncMock()
    consumer._retry_exchange = MagicMock()
    consumer._retry_exchange.publish = AsyncMock()
    return consumer


def _message(headers: dict | None = None, body: bytes = b"{}") -> MagicMock:
    message = MagicMock()
    message.body = body
    message.headers = headers or {}
    message.content_type = "application/json"
    return message


class TestPeekIds:
    def test_recovers_ids_from_a_wellformed_body(self):
        consumer = _consumer()
        body = json.dumps({"invoiceId": "abc-123", "tenantId": "tenant-a"}).encode()

        invoice_id, tenant_id = consumer._peek_ids(body)

        assert invoice_id == "abc-123"
        assert tenant_id == "tenant-a"

    def test_returns_none_pair_on_unparseable_body(self):
        consumer = _consumer()

        invoice_id, tenant_id = consumer._peek_ids(b"not json at all")

        assert (invoice_id, tenant_id) == (None, None)


class TestRetryLadder:
    @pytest.mark.parametrize(
        "attempt,expected_routing_key",
        [(0, "retry.5s"), (1, "retry.30s"), (2, "retry.2m")],
    )
    async def test_escalates_through_the_ladder_without_reaching_the_dlq(self, attempt, expected_routing_key):
        consumer = _consumer()
        message = _message(headers={RETRY_ATTEMPT_HEADER: attempt})

        await consumer._route_to_retry_ladder(message, "invoice-1", "tenant-a")

        _, kwargs = consumer._retry_exchange.publish.call_args
        assert kwargs["routing_key"] == expected_routing_key
        consumer._publisher.publish_invoice_failed.assert_not_awaited()

    async def test_increments_the_retry_attempt_header_on_each_hop(self):
        consumer = _consumer()
        message = _message(headers={RETRY_ATTEMPT_HEADER: 1})

        await consumer._route_to_retry_ladder(message, "invoice-1", "tenant-a")

        published_message = consumer._retry_exchange.publish.call_args.args[0]
        assert published_message.headers[RETRY_ATTEMPT_HEADER] == 2

    async def test_exhausting_the_ladder_routes_to_the_dlq_and_publishes_invoice_failed(self):
        consumer = _consumer()
        invoice_id = "11111111-1111-1111-1111-111111111111"
        message = _message(headers={RETRY_ATTEMPT_HEADER: len(RETRY_LADDER)})

        await consumer._route_to_retry_ladder(message, invoice_id, "tenant-a")

        _, kwargs = consumer._retry_exchange.publish.call_args
        assert kwargs["routing_key"] == DLQ_ROUTING_KEY
        consumer._publisher.publish_invoice_failed.assert_awaited_once()
        published_event = consumer._publisher.publish_invoice_failed.call_args.args[0]
        assert isinstance(published_event, InvoiceFailed)
        assert str(published_event.invoice_id) == invoice_id
        assert published_event.tenant_id == "tenant-a"

    async def test_does_not_publish_invoice_failed_when_ids_could_not_be_recovered(self):
        # The message body wasn't even parseable — nothing to build a valid
        # InvoiceFailed event from, so this should degrade to "log only"
        # rather than raise.
        consumer = _consumer()
        message = _message(headers={RETRY_ATTEMPT_HEADER: len(RETRY_LADDER)})

        await consumer._route_to_retry_ladder(message, None, None)

        consumer._publisher.publish_invoice_failed.assert_not_awaited()


class TestHandleMessage:
    async def test_successful_processing_publishes_parsed_and_acks(self):
        consumer = _consumer()
        consumer._process_event = AsyncMock()
        message = _message(
            body=json.dumps(
                {"invoiceId": "11111111-1111-1111-1111-111111111111",
                 "tenantId": "tenant-a", "userId": "22222222-2222-2222-2222-222222222222",
                 "fileKey": "tenant-a/some/key"}
            ).encode()
        )
        message.ack = AsyncMock()

        await consumer._handle_message(message)

        consumer._process_event.assert_awaited_once()
        message.ack.assert_awaited_once()

    async def test_a_failure_routes_to_the_retry_ladder_and_still_acks(self):
        consumer = _consumer()
        consumer._process_event = AsyncMock(side_effect=RuntimeError("boom"))
        message = _message(
            body=json.dumps(
                {"invoiceId": "11111111-1111-1111-1111-111111111111",
                 "tenantId": "tenant-a", "userId": "22222222-2222-2222-2222-222222222222",
                 "fileKey": "tenant-a/some/key"}
            ).encode(),
            headers={},
        )
        message.ack = AsyncMock()

        await consumer._handle_message(message)

        consumer._retry_exchange.publish.assert_awaited_once()
        message.ack.assert_awaited_once()
