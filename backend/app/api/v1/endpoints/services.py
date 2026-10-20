import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_professional
from app.core.exceptions import ForbiddenException, ResourceNotFoundException
from app.db.session import get_db
from app.models.category import Category
from app.models.governance import SupportedCurrency
from app.models.professional import ProfessionalProfile
from app.models.service import Service
from app.models.user import User
from app.schemas.base import PaginatedResponseModel, PaginationMeta, ResponseModel
from app.schemas.service import ServiceCreate, ServiceResponse, ServiceUpdate

router = APIRouter()


@router.get("", response_model=PaginatedResponseModel[ServiceResponse])
async def list_services(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    category_id: uuid.UUID | None = None,
    professional_id: uuid.UUID | None = None,
    query: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Service).where(Service.status == "active").order_by(Service.created_at.desc())

    if category_id:
        stmt = stmt.where(Service.category_id == category_id)
    if professional_id:
        stmt = stmt.where(Service.professional_id == professional_id)
    if query:
        term = f"%{query.lower()}%"
        stmt = stmt.where((Service.title.ilike(term)) | (Service.description.ilike(term)))

    all_res = await db.scalars(stmt)
    all_items = all_res.all()
    total_count = len(all_items)

    paginated_items = all_items[offset : offset + limit]

    return PaginatedResponseModel(
        data=[ServiceResponse.model_validate(s) for s in paginated_items],
        pagination=PaginationMeta(
            offset=offset,
            limit=limit,
            total_count=total_count,
            has_next=offset + limit < total_count,
        ),
    )


@router.get("/{id}", response_model=ResponseModel[ServiceResponse])
async def get_service(id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = await db.get(Service, id)
    if not service or service.status == "archived":
        raise ResourceNotFoundException("Service not found")
    return ResponseModel(data=ServiceResponse.model_validate(service))


@router.post("", response_model=ResponseModel[ServiceResponse], status_code=status.HTTP_201_CREATED)
async def create_service(
    req: ServiceCreate,
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
):
    _, profile = professional_data

    # Validate category exists and is active
    category = await db.get(Category, req.category_id)
    if not category or not category.is_active:
        raise ResourceNotFoundException("Selected category does not exist or is inactive")

    # If category is regulated, verify professional is verified
    if category.is_regulated and profile.verification_status != "verified":
        raise ForbiddenException(
            f"The '{category.name}' category is regulated. You must complete professional credential verification before publishing services in this category."
        )

    # Validate currency
    currency = await db.get(SupportedCurrency, req.currency_code.upper())
    if not currency or not currency.is_enabled:
        raise ResourceNotFoundException(f"Currency '{req.currency_code}' is not supported")

    new_service = Service(
        professional_id=profile.id,
        category_id=category.id,
        title=req.title.strip(),
        description=req.description.strip(),
        price_type=req.price_type,
        base_price=req.base_price,
        currency_code=currency.code,
        delivery_days=req.delivery_days,
        status="active",
    )
    db.add(new_service)
    await db.commit()
    await db.refresh(new_service)

    return ResponseModel(data=ServiceResponse.model_validate(new_service))


@router.put("/{id}", response_model=ResponseModel[ServiceResponse])
async def update_service(
    id: uuid.UUID,
    req: ServiceUpdate,
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
):
    _, profile = professional_data
    service = await db.get(Service, id)
    if not service:
        raise ResourceNotFoundException("Service not found")
    if service.professional_id != profile.id:
        raise ForbiddenException("You do not have permission to edit this service")

    if req.title is not None:
        service.title = req.title.strip()
    if req.description is not None:
        service.description = req.description.strip()
    if req.price_type is not None:
        service.price_type = req.price_type
    if req.base_price is not None:
        service.base_price = req.base_price
    if req.delivery_days is not None:
        service.delivery_days = req.delivery_days
    if req.status is not None:
        service.status = req.status

    await db.commit()
    await db.refresh(service)

    return ResponseModel(data=ServiceResponse.model_validate(service))


@router.delete("/{id}", response_model=ResponseModel[dict])
async def archive_service(
    id: uuid.UUID,
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
):
    _, profile = professional_data
    service = await db.get(Service, id)
    if not service:
        raise ResourceNotFoundException("Service not found")
    if service.professional_id != profile.id:
        raise ForbiddenException("You do not have permission to delete this service")

    service.status = "archived"
    await db.commit()

    return ResponseModel(data={"message": "Service archived successfully"})
