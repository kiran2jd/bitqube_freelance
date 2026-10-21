import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CreatePaymentOrderRequest(BaseModel):
    milestone_id: uuid.UUID


class PaymentOrderResponse(BaseModel):
    payment_id: uuid.UUID
    order_id: str
    amount: Decimal
    currency: str
    key_id: str
    milestone_title: str
    original_amount: Decimal | None = None
    original_currency: str | None = None
    exchange_rate: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)


class VerifyPaymentRequest(BaseModel):
    payment_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentResponse(BaseModel):
    id: uuid.UUID
    milestone_id: uuid.UUID
    payer_id: uuid.UUID
    payee_id: uuid.UUID
    provider: str
    provider_reference: str | None = None
    amount: Decimal
    platform_fee: Decimal
    currency_code: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LedgerEntryResponse(BaseModel):
    id: uuid.UUID
    payment_id: uuid.UUID | None = None
    account_code: str
    entry_type: str
    amount: Decimal
    currency_code: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceResponse(BaseModel):
    invoice_number: str
    payment_id: uuid.UUID
    contract_id: uuid.UUID
    milestone_title: str
    payer_name: str
    payee_name: str
    amount: Decimal
    platform_fee: Decimal
    currency_code: str
    status: str
    date: datetime

    model_config = ConfigDict(from_attributes=True)
