import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db, require_roles
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.category import Category
from app.models.project import Project
from app.models.proposal import Proposal
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.schemas.proposal import ProposalResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[list[ProjectResponse]])
async def list_projects(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: uuid.UUID | None = Query(None),
    customer_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists published marketplace projects with filtering and search."""
    stmt = (
        select(Project)
        .options(
            selectinload(Project.category),
            selectinload(Project.customer),
            selectinload(Project.proposals),
        )
        .order_by(Project.created_at.desc())
    )

    if category_id:
        stmt = stmt.where(Project.category_id == category_id)
    if customer_id:
        stmt = stmt.where(Project.customer_id == customer_id)
    if status:
        stmt = stmt.where(Project.status == status)
    else:
        # Default to open projects if not querying by customer
        if not customer_id:
            stmt = stmt.where(Project.status.in_(["open", "in_progress"]))

    if search:
        search_filter = f"%{search}%"
        stmt = stmt.where(
            or_(
                Project.title.ilike(search_filter),
                Project.description.ilike(search_filter),
            )
        )

    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_count = (await db.scalar(count_stmt)) or 0

    results = await db.scalars(stmt.offset(offset).limit(limit))
    projects = results.all()

    items: list[ProjectResponse] = []
    for p in projects:
        items.append(
            ProjectResponse(
                id=p.id,
                customer_id=p.customer_id,
                category_id=p.category_id,
                title=p.title,
                description=p.description,
                budget_min=p.budget_min,
                budget_max=p.budget_max,
                currency_code=p.currency_code,
                deadline=p.deadline,
                status=p.status,
                created_at=p.created_at,
                updated_at=p.updated_at,
                category_name=p.category.name if p.category else None,
                customer_name=f"{p.customer.first_name} {p.customer.last_name}" if p.customer else None,
                proposals_count=len(p.proposals) if p.proposals else 0,
            )
        )

    return ApiResponse.ok(
        data=items,
        pagination={
            "offset": offset,
            "limit": limit,
            "total_count": total_count,
            "has_next": (offset + limit) < total_count,
        },
    )


@router.post("", response_model=ApiResponse[ProjectResponse], status_code=201)
async def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(require_roles(["customer"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Creates a new project brief by an authenticated customer."""
    # Validate category exists and is active
    category = await db.get(Category, payload.category_id)
    if not category or not category.is_active:
        raise BadRequestException("Selected category does not exist or is inactive")

    project = Project(
        customer_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        budget_min=payload.budget_min,
        budget_max=payload.budget_max,
        currency_code=payload.currency_code.upper(),
        deadline=payload.deadline,
        status="open",
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    return ApiResponse.ok(
        data=ProjectResponse(
            id=project.id,
            customer_id=project.customer_id,
            category_id=project.category_id,
            title=project.title,
            description=project.description,
            budget_min=project.budget_min,
            budget_max=project.budget_max,
            currency_code=project.currency_code,
            deadline=project.deadline,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            category_name=category.name,
            customer_name=f"{current_user.first_name} {current_user.last_name}",
            proposals_count=0,
        )
    )


@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Fetches details for a single project."""
    stmt = (
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.category),
            selectinload(Project.customer),
            selectinload(Project.proposals),
        )
    )
    project = await db.scalar(stmt)
    if not project:
        raise NotFoundException("Project not found")

    return ApiResponse.ok(
        data=ProjectResponse(
            id=project.id,
            customer_id=project.customer_id,
            category_id=project.category_id,
            title=project.title,
            description=project.description,
            budget_min=project.budget_min,
            budget_max=project.budget_max,
            currency_code=project.currency_code,
            deadline=project.deadline,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            category_name=project.category.name if project.category else None,
            customer_name=f"{project.customer.first_name} {project.customer.last_name}" if project.customer else None,
            proposals_count=len(project.proposals) if project.proposals else 0,
        )
    )


@router.patch("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Updates a project by its owner customer or administrator."""
    project = await db.get(Project, project_id)
    if not project:
        raise NotFoundException("Project not found")

    user_roles = [r.role for r in current_user.roles]
    if project.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("You are not authorized to update this project")

    if project.status not in ("draft", "open"):
        raise BadRequestException(f"Cannot update project with status '{project.status}'")

    if payload.title is not None:
        project.title = payload.title
    if payload.description is not None:
        project.description = payload.description
    if payload.budget_min is not None:
        project.budget_min = payload.budget_min
    if payload.budget_max is not None:
        project.budget_max = payload.budget_max
    if payload.deadline is not None:
        project.deadline = payload.deadline
    if payload.status is not None:
        project.status = payload.status

    await db.commit()
    await db.refresh(project)

    return ApiResponse.ok(
        data=ProjectResponse(
            id=project.id,
            customer_id=project.customer_id,
            category_id=project.category_id,
            title=project.title,
            description=project.description,
            budget_min=project.budget_min,
            budget_max=project.budget_max,
            currency_code=project.currency_code,
            deadline=project.deadline,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            category_name=project.category.name if project.category else None,
            customer_name=f"{project.customer.first_name} {project.customer.last_name}" if project.customer else None,
            proposals_count=len(project.proposals) if project.proposals else 0,
        )
    )


@router.get("/{project_id}/proposals", response_model=ApiResponse[list[ProposalResponse]])
async def get_project_proposals(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists proposals submitted for a specific project. Authorized to project owner or administrator."""
    project = await db.get(Project, project_id)
    if not project:
        raise NotFoundException("Project not found")

    user_roles = [r.role for r in current_user.roles]
    if project.customer_id != current_user.id and "administrator" not in user_roles:
        raise ForbiddenException("Only the project owner can view proposals")

    stmt = (
        select(Proposal)
        .where(Proposal.project_id == project_id)
        .options(selectinload(Proposal.professional))
        .order_by(Proposal.created_at.desc())
    )
    proposals = (await db.scalars(stmt)).all()

    items: list[ProposalResponse] = []
    for prop in proposals:
        items.append(
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
                professional_name=prop.professional.display_name if prop.professional else None,
                professional_title=prop.professional.title if prop.professional else None,
                professional_rating=prop.professional.rating_average if prop.professional else 5.0,
                is_verified=prop.professional.verification_status == "verified" if prop.professional else False,
            )
        )

    return ApiResponse.ok(data=items)
