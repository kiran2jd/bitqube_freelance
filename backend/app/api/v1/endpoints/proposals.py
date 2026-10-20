import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_current_professional, get_db
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.contract import Contract
from app.models.milestone import Milestone
from app.models.professional import ProfessionalProfile
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.contract import ContractResponse, MilestoneResponse
from app.schemas.proposal import ProposalCreate, ProposalResponse

router = APIRouter()


@router.post("", response_model=ApiResponse[ProposalResponse], status_code=201)
async def submit_proposal(
    payload: ProposalCreate,
    auth_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Submits a competitive bid / proposal for an open project."""
    _, profile = auth_data

    # Check project exists and is open
    project = await db.get(Project, payload.project_id)
    if not project:
        raise NotFoundException("Project not found")

    if project.status != "open":
        raise BadRequestException(f"Cannot submit proposal to project with status '{project.status}'")

    # Check if professional already submitted a proposal
    stmt = select(Proposal).where(
        Proposal.project_id == payload.project_id,
        Proposal.professional_id == profile.id,
    )
    existing = await db.scalar(stmt)
    if existing:
        raise ConflictException("You have already submitted a proposal for this project")

    proposal = Proposal(
        project_id=payload.project_id,
        professional_id=profile.id,
        amount=payload.amount,
        currency_code=payload.currency_code.upper(),
        estimated_duration_days=payload.estimated_duration_days,
        cover_letter=payload.cover_letter,
        status="submitted",
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)

    return ApiResponse.ok(
        data=ProposalResponse(
            id=proposal.id,
            project_id=proposal.project_id,
            professional_id=proposal.professional_id,
            amount=proposal.amount,
            currency_code=proposal.currency_code,
            estimated_duration_days=proposal.estimated_duration_days,
            cover_letter=proposal.cover_letter,
            status=proposal.status,
            created_at=proposal.created_at,
            professional_name=profile.display_name,
            professional_title=profile.title,
            professional_rating=profile.rating_average,
            is_verified=profile.verification_status == "verified",
        )
    )


@router.get("/me", response_model=ApiResponse[list[ProposalResponse]])
async def get_my_proposals(
    auth_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all proposals submitted by the current authenticated professional."""
    _, profile = auth_data
    stmt = (
        select(Proposal)
        .where(Proposal.professional_id == profile.id)
        .order_by(Proposal.created_at.desc())
    )
    proposals = (await db.scalars(stmt)).all()

    items: list[ProposalResponse] = [
        ProposalResponse(
            id=prop.id,
            project_id=prop.project_id,
            professional_id=prop.professional_id,
            amount=prop.amount,
            currency_code=prop.currency_code,
            estimated_duration_days=prop.estimated_duration_days,
            cover_letter=prop.cover_letter,
            status=prop.status,
            created_at=prop.created_at,
            professional_name=profile.display_name,
            professional_title=profile.title,
            professional_rating=profile.rating_average,
            is_verified=profile.verification_status == "verified",
        )
        for prop in proposals
    ]
    return ApiResponse.ok(data=items)


@router.post("/{proposal_id}/accept", response_model=ApiResponse[ContractResponse])
async def accept_proposal(
    proposal_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Accepts a proposal, transitioning project to in_progress, rejecting remaining bids,
    and generating the formal Contract and Milestones.
    """
    stmt = (
        select(Proposal)
        .where(Proposal.id == proposal_id)
        .options(
            selectinload(Proposal.project),
            selectinload(Proposal.professional),
        )
    )
    proposal = await db.scalar(stmt)
    if not proposal:
        raise NotFoundException("Proposal not found")

    project = proposal.project
    user_roles = [r.role for r in current_user.roles]
    if project.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Only the project owner can accept this proposal")

    if project.status != "open":
        raise BadRequestException(f"Project is not open (current status: {project.status})")

    if proposal.status != "submitted":
        raise BadRequestException(f"Proposal cannot be accepted from status '{proposal.status}'")

    # 1. Update accepted proposal
    proposal.status = "accepted"

    # 2. Reject other proposals on the same project
    await db.execute(
        update(Proposal)
        .where(
            Proposal.project_id == project.id,
            Proposal.id != proposal.id,
            Proposal.status == "submitted",
        )
        .values(status="rejected")
    )

    # 3. Update project status to in_progress
    project.status = "in_progress"

    # 4. Create Contract
    now = datetime.now(UTC)
    contract = Contract(
        project_id=project.id,
        proposal_id=proposal.id,
        customer_id=project.customer_id,
        professional_id=proposal.professional_id,
        agreed_amount=proposal.amount,
        currency_code=proposal.currency_code,
        terms_version="1.0-standard",
        status="active",
        accepted_at=now,
    )
    db.add(contract)
    await db.flush()  # Generate contract.id

    # 5. Create default initial milestone
    due_date = now + timedelta(days=proposal.estimated_duration_days)
    initial_milestone = Milestone(
        contract_id=contract.id,
        title="Project Deliverable & Completion",
        description=f"Delivery of full project scope as outlined in proposal for '{project.title}'",
        amount=proposal.amount,
        currency_code=proposal.currency_code,
        due_at=due_date,
        status="pending",
    )
    db.add(initial_milestone)

    await db.commit()
    await db.refresh(contract)
    await db.refresh(initial_milestone)

    return ApiResponse.ok(
        data=ContractResponse(
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
            project_title=project.title,
            customer_name=f"{current_user.first_name} {current_user.last_name}",
            professional_name=proposal.professional.display_name,
            milestones=[
                MilestoneResponse(
                    id=initial_milestone.id,
                    contract_id=initial_milestone.contract_id,
                    title=initial_milestone.title,
                    description=initial_milestone.description,
                    amount=initial_milestone.amount,
                    currency_code=initial_milestone.currency_code,
                    due_at=initial_milestone.due_at,
                    status=initial_milestone.status,
                    submitted_at=initial_milestone.submitted_at,
                    approved_at=initial_milestone.approved_at,
                    deliverable_notes=initial_milestone.deliverable_notes,
                    created_at=initial_milestone.created_at,
                )
            ],
        )
    )


@router.post("/{proposal_id}/withdraw", response_model=ApiResponse[ProposalResponse])
async def withdraw_proposal(
    proposal_id: uuid.UUID,
    auth_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Withdraws a previously submitted proposal."""
    _, profile = auth_data
    proposal = await db.get(Proposal, proposal_id)
    if not proposal:
        raise NotFoundException("Proposal not found")

    if proposal.professional_id != profile.id:
        raise ForbiddenException("You cannot withdraw another consultant's proposal")

    if proposal.status != "submitted":
        raise BadRequestException(f"Cannot withdraw proposal with status '{proposal.status}'")

    proposal.status = "withdrawn"
    await db.commit()
    await db.refresh(proposal)

    return ApiResponse.ok(
        data=ProposalResponse(
            id=proposal.id,
            project_id=proposal.project_id,
            professional_id=proposal.professional_id,
            amount=proposal.amount,
            currency_code=proposal.currency_code,
            estimated_duration_days=proposal.estimated_duration_days,
            cover_letter=proposal.cover_letter,
            status=proposal.status,
            created_at=proposal.created_at,
            professional_name=profile.display_name,
            professional_title=profile.title,
            professional_rating=profile.rating_average,
            is_verified=profile.verification_status == "verified",
        )
    )
