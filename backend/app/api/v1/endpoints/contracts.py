import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.config import settings
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.contract import Contract
from app.models.payment import Payment
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.contract import (
    ContractResponse,
    MilestoneApproveRequest,
    MilestoneDeliverableSubmit,
    MilestoneResponse,
)
from app.services.payment.ledger_service import ledger_service

router = APIRouter()


def _build_contract_response(contract: Contract) -> ContractResponse:
    milestone_items = [
        MilestoneResponse(
            id=m.id,
            contract_id=m.contract_id,
            title=m.title,
            description=m.description,
            amount=m.amount,
            currency_code=m.currency_code,
            due_at=m.due_at,
            status=m.status,
            submitted_at=m.submitted_at,
            approved_at=m.approved_at,
            deliverable_notes=m.deliverable_notes,
            created_at=m.created_at,
        )
        for m in (contract.milestones or [])
    ]

    return ContractResponse(
        id=contract.id,
        project_id=contract.project_id,
        proposal_id=contract.proposal_id,
        customer_id=contract.customer_id,
        professional_id=contract.professional_id,
        agreed_amount=contract.agreed_amount,
        currency_code=contract.currency_code,
        terms_version=contract.terms_version,
        status=contract.status,
        accepted_at=contract.accepted_at,
        completed_at=contract.completed_at,
        created_at=contract.created_at,
        project_title=contract.project.title if contract.project else None,
        customer_name=f"{contract.customer.first_name} {contract.customer.last_name}" if contract.customer else None,
        professional_name=contract.professional.display_name if contract.professional else None,
        milestones=milestone_items,
    )


@router.get("", response_model=ApiResponse[list[ContractResponse]])
async def list_contracts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all contracts associated with current user (as customer or professional)."""
    user_roles = [r.role for r in current_user.roles]

    stmt = (
        select(Contract)
        .options(
            selectinload(Contract.project),
            selectinload(Contract.customer),
            selectinload(Contract.professional),
            selectinload(Contract.milestones),
        )
        .order_by(Contract.created_at.desc())
    )

    if "administrator" not in user_roles:
        clauses = [Contract.customer_id == current_user.id]
        if current_user.professional_profile:
            clauses.append(Contract.professional_id == current_user.professional_profile.id)
        stmt = stmt.where(or_(*clauses))

    contracts = (await db.scalars(stmt)).all()
    items = [_build_contract_response(c) for c in contracts]
    return ApiResponse.ok(data=items)


@router.get("/{contract_id}", response_model=ApiResponse[ContractResponse])
async def get_contract(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetches full details of a specific contract."""
    stmt = (
        select(Contract)
        .where(Contract.id == contract_id)
        .options(
            selectinload(Contract.project),
            selectinload(Contract.customer),
            selectinload(Contract.professional),
            selectinload(Contract.milestones),
        )
    )
    contract = await db.scalar(stmt)
    if not contract:
        raise NotFoundException("Contract not found")

    user_roles = [r.role for r in current_user.roles]
    is_customer = contract.customer_id == current_user.id
    is_prof = current_user.professional_profile and contract.professional_id == current_user.professional_profile.id
    if not is_customer and not is_prof and "administrator" not in user_roles:
        raise ForbiddenException("You are not a party to this contract")

    return ApiResponse.ok(data=_build_contract_response(contract))


@router.post("/{contract_id}/milestones/{milestone_id}/fund", response_model=ApiResponse[ContractResponse])
async def fund_milestone(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Customer funds milestone to authorize commencement of work."""
    stmt = (
        select(Contract)
        .where(Contract.id == contract_id)
        .options(
            selectinload(Contract.project),
            selectinload(Contract.customer),
            selectinload(Contract.professional),
            selectinload(Contract.milestones),
        )
    )
    contract = await db.scalar(stmt)
    if not contract:
        raise NotFoundException("Contract not found")

    user_roles = [r.role for r in current_user.roles]
    if contract.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Only the customer can fund this milestone")

    milestone = next((m for m in contract.milestones if m.id == milestone_id), None)
    if not milestone:
        raise NotFoundException("Milestone not found in this contract")

    if milestone.status not in ("pending",):
        raise BadRequestException(f"Milestone cannot be funded from status '{milestone.status}'")

    milestone.status = "funded"
    await db.commit()
    await db.refresh(contract)

    return ApiResponse.ok(data=_build_contract_response(contract))


@router.post("/{contract_id}/milestones/{milestone_id}/submit", response_model=ApiResponse[ContractResponse])
async def submit_milestone_deliverable(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    payload: MilestoneDeliverableSubmit,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Professional submits deliverables and notes for client approval."""
    stmt = (
        select(Contract)
        .where(Contract.id == contract_id)
        .options(
            selectinload(Contract.project),
            selectinload(Contract.customer),
            selectinload(Contract.professional),
            selectinload(Contract.milestones),
        )
    )
    contract = await db.scalar(stmt)
    if not contract:
        raise NotFoundException("Contract not found")

    is_prof = current_user.professional_profile and contract.professional_id == current_user.professional_profile.id
    user_roles = [r.role for r in current_user.roles]
    if not is_prof and "administrator" not in user_roles:
        raise ForbiddenException("Only the assigned professional can submit milestone deliverables")

    milestone = next((m for m in contract.milestones if m.id == milestone_id), None)
    if not milestone:
        raise NotFoundException("Milestone not found in this contract")

    if milestone.status not in ("pending", "funded"):
        raise BadRequestException(f"Cannot submit deliverable for milestone with status '{milestone.status}'")

    milestone.deliverable_notes = payload.deliverable_notes
    milestone.submitted_at = datetime.now(UTC)
    milestone.status = "submitted"

    await db.commit()
    await db.refresh(contract)

    return ApiResponse.ok(data=_build_contract_response(contract))


@router.post("/{contract_id}/milestones/{milestone_id}/approve", response_model=ApiResponse[ContractResponse])
async def approve_milestone_deliverable(
    contract_id: uuid.UUID,
    milestone_id: uuid.UUID,
    payload: MilestoneApproveRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Customer approves milestone deliverable. If all milestones are approved, completes contract."""
    stmt = (
        select(Contract)
        .where(Contract.id == contract_id)
        .options(
            selectinload(Contract.project),
            selectinload(Contract.customer),
            selectinload(Contract.professional),
            selectinload(Contract.milestones),
        )
    )
    contract = await db.scalar(stmt)
    if not contract:
        raise NotFoundException("Contract not found")

    user_roles = [r.role for r in current_user.roles]
    if contract.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Only the customer can approve this milestone")

    milestone = next((m for m in contract.milestones if m.id == milestone_id), None)
    if not milestone:
        raise NotFoundException("Milestone not found in this contract")

    if milestone.status != "submitted":
        raise BadRequestException(f"Cannot approve milestone with status '{milestone.status}'")

    now = datetime.now(UTC)
    milestone.status = "approved"
    milestone.approved_at = now

    # Post Double-Entry Ledger entries for release of funds and platform commission
    fee_pct = Decimal(str(settings.PLATFORM_FEE_PERCENTAGE))
    platform_fee = round((milestone.amount * fee_pct) / Decimal("100"), 2)

    payment_stmt = select(Payment).where(Payment.milestone_id == milestone.id)
    payment = await db.scalar(payment_stmt)
    payment_id = payment.id if payment else None
    if payment:
        platform_fee = payment.platform_fee

    await ledger_service.record_milestone_released(
        db=db,
        payment_id=payment_id,
        amount=milestone.amount,
        platform_fee=platform_fee,
        currency_code=milestone.currency_code,
        description=f"Milestone approved: '{milestone.title}'",
    )

    # Check if all milestones are approved
    all_approved = all(m.status == "approved" for m in contract.milestones)
    if all_approved:
        contract.status = "completed"
        contract.completed_at = now
        if contract.project:
            contract.project.status = "completed"

    await db.commit()
    await db.refresh(contract)

    return ApiResponse.ok(data=_build_contract_response(contract))
