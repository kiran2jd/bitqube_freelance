import hashlib
import hmac
import uuid
from decimal import Decimal
from typing import Any

from app.core.config import settings
from app.services.payment.base import PaymentGateway


class RazorpayGateway(PaymentGateway):
    def __init__(
        self,
        key_id: str | None = None,
        key_secret: str | None = None,
        webhook_secret: str | None = None,
    ):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = webhook_secret or settings.RAZORPAY_WEBHOOK_SECRET

    async def create_order(
        self,
        payment_id: str,
        amount: Decimal,
        currency: str,
        receipt: str,
        notes: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Creates a Razorpay order. Amount is converted to smallest currency unit (paise for INR).
        In test/dev environments without external network access, generates a standard order representation.
        """
        amount_paise = int(amount * 100)

        # In dev/mock mode or placeholder keys
        if "placeholder" in self.key_id or settings.ENVIRONMENT == "development":
            order_id = f"order_{uuid.uuid4().hex[:14]}"
            return {
                "id": order_id,
                "entity": "order",
                "amount": amount_paise,
                "amount_paid": 0,
                "amount_due": amount_paise,
                "currency": currency.upper(),
                "receipt": receipt,
                "status": "created",
                "notes": notes or {},
            }

        # Real Razorpay client integration
        import razorpay

        client = razorpay.Client(auth=(self.key_id, self.key_secret))
        order_data = {
            "amount": amount_paise,
            "currency": currency.upper(),
            "receipt": receipt,
            "notes": notes or {},
        }
        return client.order.create(data=order_data)

    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> bool:
        """
        Verifies Razorpay payment signature using HMAC-SHA256:
        signature = hmac_sha256(order_id + "|" + payment_id, secret)
        """
        # Support mock test signatures in dev/testing
        if signature.startswith("test_sig_") and (settings.DEBUG or "placeholder" in self.key_secret):
            return True

        message = f"{order_id}|{payment_id}".encode()
        generated_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(generated_signature, signature)

    def verify_webhook_signature(
        self,
        raw_payload: bytes,
        signature: str,
    ) -> bool:
        """Verifies Razorpay webhook signature."""
        if signature.startswith("test_wh_sig_") and (settings.DEBUG or "placeholder" in self.webhook_secret):
            return True

        generated_signature = hmac.new(
            self.webhook_secret.encode("utf-8"),
            raw_payload,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(generated_signature, signature)

    async def process_refund(
        self,
        payment_reference: str,
        amount: Decimal,
        notes: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Issues refund via Razorpay Refunds API."""
        amount_paise = int(amount * 100)

        if "placeholder" in self.key_id or settings.ENVIRONMENT == "development":
            return {
                "id": f"rfnd_{uuid.uuid4().hex[:14]}",
                "entity": "refund",
                "amount": amount_paise,
                "currency": "INR",
                "payment_id": payment_reference,
                "status": "processed",
                "notes": notes or {},
            }

        import razorpay

        client = razorpay.Client(auth=(self.key_id, self.key_secret))
        return client.payment.refund(
            payment_reference,
            {"amount": amount_paise, "notes": notes or {}},
        )


razorpay_gateway = RazorpayGateway()
