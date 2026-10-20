import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ledger import LedgerEntry


class LedgerAccount:
    GATEWAY_SETTLEMENT_RECEIVABLE = "GATEWAY_SETTLEMENT_RECEIVABLE"
    CUSTOMER_FUNDS_HELD = "CUSTOMER_FUNDS_HELD"
    PROFESSIONAL_EARNINGS = "PROFESSIONAL_EARNINGS"
    PLATFORM_COMMISSION_REVENUE = "PLATFORM_COMMISSION_REVENUE"


class LedgerService:
    @staticmethod
    async def record_milestone_funded(
        db: AsyncSession,
        payment_id: uuid.UUID | None,
        amount: Decimal,
        currency_code: str,
        description: str,
    ) -> list[LedgerEntry]:
        """
        Records milestone funding into general ledger:
        - DEBIT GATEWAY_SETTLEMENT_RECEIVABLE (Asset +)
        - CREDIT CUSTOMER_FUNDS_HELD (Liability +)
        """
        entries = [
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.GATEWAY_SETTLEMENT_RECEIVABLE,
                entry_type="DEBIT",
                amount=amount,
                currency_code=currency_code,
                description=f"Payment received: {description}",
            ),
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.CUSTOMER_FUNDS_HELD,
                entry_type="CREDIT",
                amount=amount,
                currency_code=currency_code,
                description=f"Client escrow held: {description}",
            ),
        ]
        db.add_all(entries)
        return entries

    @staticmethod
    async def record_milestone_released(
        db: AsyncSession,
        payment_id: uuid.UUID | None,
        amount: Decimal,
        platform_fee: Decimal,
        currency_code: str,
        description: str,
    ) -> list[LedgerEntry]:
        """
        Records milestone release and fee split upon client approval:
        - DEBIT CUSTOMER_FUNDS_HELD (Liability -)
        - CREDIT PROFESSIONAL_EARNINGS (Liability +)
        - CREDIT PLATFORM_COMMISSION_REVENUE (Revenue +)
        """
        professional_earnings = amount - platform_fee

        entries = [
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.CUSTOMER_FUNDS_HELD,
                entry_type="DEBIT",
                amount=amount,
                currency_code=currency_code,
                description=f"Client escrow released: {description}",
            ),
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.PROFESSIONAL_EARNINGS,
                entry_type="CREDIT",
                amount=professional_earnings,
                currency_code=currency_code,
                description=f"Consultant earnings payable: {description}",
            ),
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.PLATFORM_COMMISSION_REVENUE,
                entry_type="CREDIT",
                amount=platform_fee,
                currency_code=currency_code,
                description=f"Platform commission revenue: {description}",
            ),
        ]
        db.add_all(entries)
        return entries

    @staticmethod
    async def record_milestone_refund(
        db: AsyncSession,
        payment_id: uuid.UUID | None,
        amount: Decimal,
        currency_code: str,
        description: str,
    ) -> list[LedgerEntry]:
        """
        Records refund to customer:
        - DEBIT CUSTOMER_FUNDS_HELD (Liability -)
        - CREDIT GATEWAY_SETTLEMENT_RECEIVABLE (Asset -)
        """
        entries = [
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.CUSTOMER_FUNDS_HELD,
                entry_type="DEBIT",
                amount=amount,
                currency_code=currency_code,
                description=f"Customer refund: {description}",
            ),
            LedgerEntry(
                payment_id=payment_id,
                account_code=LedgerAccount.GATEWAY_SETTLEMENT_RECEIVABLE,
                entry_type="CREDIT",
                amount=amount,
                currency_code=currency_code,
                description=f"Gateway settlement reduction: {description}",
            ),
        ]
        db.add_all(entries)
        return entries


ledger_service = LedgerService()
