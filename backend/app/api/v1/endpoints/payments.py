import json
import uuid
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.core.rate_limit import limiter
from app.models.contract import Contract
from app.models.ledger import LedgerEntry
from app.models.milestone import Milestone
from app.models.payment import Payment
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.payment import (
    CreatePaymentOrderRequest,
    InvoiceResponse,
    LedgerEntryResponse,
    PaymentOrderResponse,
    PaymentResponse,
    VerifyPaymentRequest,
)
from app.services.payment.ledger_service import ledger_service
from app.services.payment.razorpay_adapter import razorpay_gateway

router = APIRouter()


@router.post("/orders", response_model=ApiResponse[PaymentOrderResponse], status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_payment_order(
    request: Request,
    payload: CreatePaymentOrderRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Creates a Razorpay payment order for funding a contract milestone."""
    stmt = (
        select(Milestone)
        .where(Milestone.id == payload.milestone_id)
        .options(
            selectinload(Milestone.contract).selectinload(Contract.customer),
            selectinload(Milestone.contract).selectinload(Contract.professional),
        )
    )
    milestone = await db.scalar(stmt)
    if not milestone:
        raise NotFoundException("Milestone not found")

    contract = milestone.contract
    user_roles = [r.role for r in current_user.roles]
    if contract.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Only the client can fund this milestone")

    if milestone.status != "pending":
        raise BadRequestException(f"Milestone cannot be funded from status '{milestone.status}'")

    if milestone.currency_code in ("BTQ", "QUBEX", "BTC", "ETH"):
        raise BadRequestException(
            "Cryptocurrency settlement is disabled on MVP. Platform transactions must use sovereign fiat (INR, USD, EUR, GBP)."
        )

    # Compute platform fee percentage
    fee_pct = Decimal(str(settings.PLATFORM_FEE_PERCENTAGE))
    platform_fee = round((milestone.amount * fee_pct) / Decimal("100"), 2)

    idempotency_key = f"pay_{milestone.id}_{uuid.uuid4().hex[:8]}"

    # Professional user ID
    payee_user_id = contract.professional.user_id

    payment = Payment(
        milestone_id=milestone.id,
        payer_id=current_user.id,
        payee_id=payee_user_id,
        provider="razorpay",
        idempotency_key=idempotency_key,
        amount=milestone.amount,
        platform_fee=platform_fee,
        currency_code=milestone.currency_code,
        status="initiated",
    )
    db.add(payment)
    await db.flush()

    # Call Razorpay to create order
    order_data = await razorpay_gateway.create_order(
        payment_id=str(payment.id),
        amount=milestone.amount,
        currency=milestone.currency_code,
        receipt=f"rcpt_{payment.id.hex[:10]}",
        notes={
            "contract_id": str(contract.id),
            "milestone_id": str(milestone.id),
            "payment_id": str(payment.id),
        },
    )

    payment.provider_reference = order_data["id"]
    await db.commit()
    await db.refresh(payment)

    return ApiResponse.ok(
        data=PaymentOrderResponse(
            payment_id=payment.id,
            order_id=order_data["id"],
            amount=payment.amount,
            currency=payment.currency_code,
            key_id=settings.RAZORPAY_KEY_ID,
            milestone_title=milestone.title,
        )
    )


@router.post("/verify", response_model=ApiResponse[PaymentResponse])
async def verify_payment(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Cryptographically verifies Razorpay payment signature (HMAC-SHA256),
    transitions milestone to 'funded', and records double-entry general ledger entries.
    """
    stmt = (
        select(Payment)
        .where(Payment.id == payload.payment_id)
        .options(
            selectinload(Payment.milestone).selectinload(Milestone.contract),
        )
    )
    payment = await db.scalar(stmt)
    if not payment:
        raise NotFoundException("Payment not found")

    user_roles = [r.role for r in current_user.roles]
    if payment.payer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Unauthorized to verify this payment")

    if payment.status == "confirmed":
        return ApiResponse.ok(data=PaymentResponse.model_validate(payment))

    if payment.status != "initiated":
        raise BadRequestException(f"Payment cannot be verified from status '{payment.status}'")

    # Verify cryptographic signature
    is_valid = razorpay_gateway.verify_payment_signature(
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        signature=payload.razorpay_signature,
    )
    if not is_valid:
        raise BadRequestException("Invalid payment signature verification failed")

    # Atomic state transition & Double-Entry Ledger Posting
    payment.status = "confirmed"
    payment.provider_reference = payload.razorpay_payment_id
    milestone = payment.milestone
    milestone.status = "funded"

    await ledger_service.record_milestone_funded(
        db=db,
        payment_id=payment.id,
        amount=payment.amount,
        currency_code=payment.currency_code,
        description=f"Funding for milestone '{milestone.title}'",
    )

    await db.commit()
    await db.refresh(payment)

    return ApiResponse.ok(data=PaymentResponse.model_validate(payment))


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Authoritative Razorpay Webhook receiver confirming asynchronous payments."""
    raw_body = await request.body()

    if not x_razorpay_signature:
        raise BadRequestException("Missing X-Razorpay-Signature header")

    is_valid = razorpay_gateway.verify_webhook_signature(
        raw_payload=raw_body,
        signature=x_razorpay_signature,
    )
    if not is_valid:
        raise BadRequestException("Invalid webhook signature")

    try:
        data = json.loads(raw_body)
    except Exception:
        raise BadRequestException("Invalid JSON body in webhook")

    event = data.get("event")
    payload = data.get("payload", {})

    if event in ("payment.captured", "order.paid"):
        payment_entity = payload.get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")

        if order_id:
            stmt = (
                select(Payment)
                .where(Payment.provider_reference == order_id)
                .options(selectinload(Payment.milestone))
            )
            payment = await db.scalar(stmt)
            if payment and payment.status == "initiated":
                payment.status = "confirmed"
                if razorpay_payment_id:
                    payment.provider_reference = razorpay_payment_id

                milestone = payment.milestone
                if milestone and milestone.status == "pending":
                    milestone.status = "funded"

                await ledger_service.record_milestone_funded(
                    db=db,
                    payment_id=payment.id,
                    amount=payment.amount,
                    currency_code=payment.currency_code,
                    description=f"Webhook confirmed: milestone '{milestone.title}'",
                )
                await db.commit()

    return {"status": "ok", "message": "Event processed"}


@router.get("/ledger", response_model=ApiResponse[list[LedgerEntryResponse]])
async def list_ledger_entries(
    payment_id: uuid.UUID | None = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists immutable double-entry ledger records."""
    stmt = select(LedgerEntry).order_by(LedgerEntry.created_at.desc())

    if payment_id:
        stmt = stmt.where(LedgerEntry.payment_id == payment_id)

    entries = (await db.scalars(stmt)).all()
    items = [LedgerEntryResponse.model_validate(e) for e in entries]
    return ApiResponse.ok(data=items)


@router.get("/milestones/{milestone_id}/invoice", response_model=ApiResponse[InvoiceResponse])
async def get_milestone_invoice(
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves authoritative invoice and tax receipt for a milestone's confirmed payment."""
    stmt = (
        select(Payment)
        .where(Payment.milestone_id == milestone_id, Payment.status.in_(["confirmed", "released"]))
        .order_by(Payment.created_at.desc())
        .options(
            selectinload(Payment.payer),
            selectinload(Payment.payee),
            selectinload(Payment.milestone).selectinload(Milestone.contract),
        )
    )
    payment = await db.scalar(stmt)
    if not payment:
        raise NotFoundException("Payment invoice not found for this milestone")

    user_roles = [r.role for r in current_user.roles]
    is_party = payment.payer_id == current_user.id or payment.payee_id == current_user.id
    if not is_party and "administrator" not in user_roles:
        raise ForbiddenException("Unauthorized to view this invoice")

    invoice_number = f"INV-BTQ-{payment.created_at.strftime('%Y%m')}-{payment.id.hex[:6].upper()}"

    return ApiResponse.ok(
        data=InvoiceResponse(
            invoice_number=invoice_number,
            payment_id=payment.id,
            contract_id=payment.milestone.contract_id,
            milestone_title=payment.milestone.title,
            payer_name=f"{payment.payer.first_name} {payment.payer.last_name}",
            payee_name=f"{payment.payee.first_name} {payment.payee.last_name}",
            amount=payment.amount,
            platform_fee=payment.platform_fee,
            currency_code=payment.currency_code,
            status=payment.status,
            date=payment.created_at,
        )
    )


@router.get("/{payment_id}/invoice", response_model=ApiResponse[InvoiceResponse])
async def get_payment_invoice(
    payment_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieves authoritative invoice and tax receipt for a confirmed milestone payment."""
    stmt = (
        select(Payment)
        .where(Payment.id == payment_id)
        .options(
            selectinload(Payment.payer),
            selectinload(Payment.payee),
            selectinload(Payment.milestone).selectinload(Milestone.contract),
        )
    )
    payment = await db.scalar(stmt)
    if not payment:
        raise NotFoundException("Payment not found")

    user_roles = [r.role for r in current_user.roles]
    is_party = payment.payer_id == current_user.id or payment.payee_id == current_user.id
    if not is_party and "administrator" not in user_roles:
        raise ForbiddenException("Unauthorized to view this invoice")

    invoice_number = f"INV-BTQ-{payment.created_at.strftime('%Y%m')}-{payment.id.hex[:6].upper()}"

    return ApiResponse.ok(
        data=InvoiceResponse(
            invoice_number=invoice_number,
            payment_id=payment.id,
            contract_id=payment.milestone.contract_id,
            milestone_title=payment.milestone.title,
            payer_name=f"{payment.payer.first_name} {payment.payer.last_name}",
            payee_name=f"{payment.payee.first_name} {payment.payee.last_name}",
            amount=payment.amount,
            platform_fee=payment.platform_fee,
            currency_code=payment.currency_code,
            status=payment.status,
            date=payment.created_at,
        )
    )
