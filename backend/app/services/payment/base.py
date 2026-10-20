from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any


class PaymentGateway(ABC):
    @abstractmethod
    async def create_order(
        self,
        payment_id: str,
        amount: Decimal,
        currency: str,
        receipt: str,
        notes: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Creates order in payment provider and returns order details."""
        pass

    @abstractmethod
    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> bool:
        """Cryptographically verifies payment signature using provider secret."""
        pass

    @abstractmethod
    def verify_webhook_signature(
        self,
        raw_payload: bytes,
        signature: str,
    ) -> bool:
        """Cryptographically verifies webhook signature using webhook secret."""
        pass

    @abstractmethod
    async def process_refund(
        self,
        payment_reference: str,
        amount: Decimal,
        notes: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Submits refund request to the provider."""
        pass
