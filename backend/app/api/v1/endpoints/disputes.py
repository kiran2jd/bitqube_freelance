from typing import Any

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.contract import Contract
from app.models.dispute import Dispute
from app.models.milestone import Milestone
from app.models.user import User
from app.schemas.admin import CreateDisputeRequest, DisputeResponse
from app.schemas.base import ApiResponse
from app.services.audit_service import record_audit_log

router = APIRouter()


@router.post("", response_model=ApiResponse[DisputeResponse], status_code=status.HTTP_201_CREATED)
async def create_dispute(
    payload: CreateDisputeRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Raises a dispute on a contract or milestone, freezing funds in escrow."""
    stmt = (
        select(Contract)
        .where(Contract.id == payload.contract_id)
        .options(
            selectinload(Contract.customer),
            selectinload(Contract.professional),
        )
    )
    contract = await db.scalar(stmt)
    if not contract:
        raise NotFoundException("Contract not found")

    is_customer = contract.customer_id == current_user.id
    is_professional = contract.professional.user_id == current_user.id
    if not (is_customer or is_professional):
        raise ForbiddenException("Only agreement counterparties can raise a dispute")

    milestone: Milestone | None = None
    if payload.milestone_id:
        stmt_m = select(Milestone).where(
            Milestone.id == payload.milestone_id,
            Milestone.contract_id == contract.id,
        )
        milestone = await db.scalar(stmt_m)
        if not milestone:
            raise NotFoundException("Milestone not found in this contract")

        if milestone.status == "approved":
            raise BadRequestException("Cannot dispute an already approved and settled milestone")

        milestone.status = "disputed"

    contract.status = "disputed"

    dispute = Dispute(
        contract_id=contract.id,
        milestone_id=payload.milestone_id,
        raised_by_id=current_user.id,
        reason=payload.reason,
        description=payload.description,
        status="opened",
    )
    db.add(dispute)
    await db.flush()

    await record_audit_log(
        db=db,
        action="dispute.raised",
        entity_type="dispute",
        entity_id=dispute.id,
        actor_id=current_user.id,
        ip_address=request.client.host if request.client else None,
        metadata={
            "contract_id": str(contract.id),
            "milestone_id": str(payload.milestone_id) if payload.milestone_id else None,
            "reason": payload.reason,
        },
    )

    await db.commit()
    await db.refresh(dispute)

    return ApiResponse.ok(
        data=DisputeResponse(
            id=dispute.id,
            contract_id=dispute.contract_id,
            milestone_id=dispute.milestone_id,
            raised_by_id=dispute.raised_by_id,
            raised_by_name=f"{current_user.first_name} {current_user.last_name}",
            reason=dispute.reason,
            description=dispute.description,
            status=dispute.status,
            resolution_notes=None,
            resolved_by=None,
            resolved_at=None,
            created_at=dispute.created_at,
        ),
        message="Dispute successfully lodged. Platform administration will investigate.",
    )


@router.get("/my", response_model=ApiResponse[list[DisputeResponse]])
async def list_my_disputes(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all disputes raised by the current user."""
    stmt = (
        select(Dispute)
        .where(Dispute.raised_by_id == current_user.id)
        .options(selectinload(Dispute.raised_by))
        .order_by(Dispute.created_at.desc())
    )
    disputes = (await db.scalars(stmt)).all()
    items = [
        DisputeResponse(
            id=d.id,
            contract_id=d.contract_id,
            milestone_id=d.milestone_id,
            raised_by_id=d.raised_by_id,
            raised_by_name=f"{current_user.first_name} {current_user.last_name}",
            reason=d.reason,
            description=d.description,
            status=d.status,
            resolution_notes=d.resolution_notes,
            resolved_by=d.resolved_by,
            resolved_at=d.resolved_at,
            created_at=d.created_at,
        )
        for d in disputes
    ]
    return ApiResponse.ok(data=items)
