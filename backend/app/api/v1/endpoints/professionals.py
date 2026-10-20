import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_professional
from app.core.exceptions import ResourceNotFoundException
from app.db.session import get_db
from app.models.governance import SupportedCountry, SupportedCurrency
from app.models.professional import ProfessionalCredential, ProfessionalProfile
from app.models.user import User
from app.schemas.base import PaginatedResponseModel, PaginationMeta, ResponseModel
from app.schemas.professional import (
    CredentialCreate,
    CredentialResponse,
    ProfessionalProfileResponse,
    ProfessionalProfileUpdate,
)

router = APIRouter()


@router.get("", response_model=PaginatedResponseModel[ProfessionalProfileResponse])
async def list_professionals(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    query: str | None = None,
    country: str | None = None,
    verified_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ProfessionalProfile)
        .options(selectinload(ProfessionalProfile.credentials))
        .order_by(ProfessionalProfile.rating_average.desc(), ProfessionalProfile.created_at.desc())
    )

    if country:
        stmt = stmt.where(ProfessionalProfile.country_code == country.upper())
    if verified_only:
        stmt = stmt.where(ProfessionalProfile.verification_status == "verified")
    if query:
        term = f"%{query.lower()}%"
        stmt = stmt.where(
            (ProfessionalProfile.display_name.ilike(term))
            | (ProfessionalProfile.title.ilike(term))
            | (ProfessionalProfile.biography.ilike(term))
        )

    # Fetch matching items
    all_matching = await db.scalars(stmt)
    all_items = all_matching.all()
    total_count = len(all_items)

    paginated_items = all_items[offset : offset + limit]

    data = [
        ProfessionalProfileResponse(
            id=p.id,
            user_id=p.user_id,
            display_name=p.display_name,
            title=p.title,
            biography=p.biography,
            country_code=p.country_code,
            hourly_rate=p.hourly_rate,
            currency_code=p.currency_code,
            skills=p.skills,
            professional_status=p.professional_status,
            verification_status=p.verification_status,
            rating_average=p.rating_average,
            total_reviews_count=p.total_reviews_count,
            created_at=p.created_at,
            credentials=[CredentialResponse.model_validate(c) for c in p.credentials],
        )
        for p in paginated_items
    ]

    return PaginatedResponseModel(
        data=data,
        pagination=PaginationMeta(
            offset=offset,
            limit=limit,
            total_count=total_count,
            has_next=offset + limit < total_count,
        ),
    )


@router.get("/me", response_model=ResponseModel[ProfessionalProfileResponse])
async def get_my_professional_profile(
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
):
    _, profile = professional_data
    return ResponseModel(
        data=ProfessionalProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            display_name=profile.display_name,
            title=profile.title,
            biography=profile.biography,
            country_code=profile.country_code,
            hourly_rate=profile.hourly_rate,
            currency_code=profile.currency_code,
            skills=profile.skills,
            professional_status=profile.professional_status,
            verification_status=profile.verification_status,
            rating_average=profile.rating_average,
            total_reviews_count=profile.total_reviews_count,
            created_at=profile.created_at,
            credentials=[CredentialResponse.model_validate(c) for c in profile.credentials],
        )
    )


@router.put("/me", response_model=ResponseModel[ProfessionalProfileResponse])
async def update_my_professional_profile(
    req: ProfessionalProfileUpdate,
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
):
    _, profile = professional_data

    if req.display_name is not None:
        profile.display_name = req.display_name.strip()
    if req.title is not None:
        profile.title = req.title.strip()
    if req.biography is not None:
        profile.biography = req.biography.strip()
    if req.hourly_rate is not None:
        profile.hourly_rate = req.hourly_rate
    if req.skills is not None:
        profile.skills = req.skills
    if req.professional_status is not None:
        profile.professional_status = req.professional_status

    if req.country_code is not None:
        c = await db.get(SupportedCountry, req.country_code.upper())
        if c and c.is_enabled:
            profile.country_code = c.country_code

    if req.currency_code is not None:
        curr = await db.get(SupportedCurrency, req.currency_code.upper())
        if curr and curr.is_enabled:
            profile.currency_code = curr.code

    await db.commit()
    await db.refresh(profile, attribute_names=["credentials"])

    return ResponseModel(
        data=ProfessionalProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            display_name=profile.display_name,
            title=profile.title,
            biography=profile.biography,
            country_code=profile.country_code,
            hourly_rate=profile.hourly_rate,
            currency_code=profile.currency_code,
            skills=profile.skills,
            professional_status=profile.professional_status,
            verification_status=profile.verification_status,
            rating_average=profile.rating_average,
            total_reviews_count=profile.total_reviews_count,
            created_at=profile.created_at,
            credentials=[CredentialResponse.model_validate(c) for c in profile.credentials],
        )
    )


@router.post("/me/credentials", response_model=ResponseModel[CredentialResponse])
async def submit_professional_credential(
    req: CredentialCreate,
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
    db: AsyncSession = Depends(get_db),
):
    _, profile = professional_data

    credential = ProfessionalCredential(
        professional_id=profile.id,
        title=req.title.strip(),
        issuing_organization=req.issuing_organization.strip(),
        credential_identifier=req.credential_identifier.strip() if req.credential_identifier else None,
        document_id=req.document_id,
        verification_status="pending",
    )
    db.add(credential)

    # Set profile status to pending verification if currently unverified
    if profile.verification_status == "unverified":
        profile.verification_status = "pending"

    await db.commit()
    await db.refresh(credential)

    return ResponseModel(data=CredentialResponse.model_validate(credential))


@router.get("/me/credentials", response_model=ResponseModel[list[CredentialResponse]])
async def list_my_credentials(
    professional_data: tuple[User, ProfessionalProfile] = Depends(get_current_professional),
):
    _, profile = professional_data
    return ResponseModel(
        data=[CredentialResponse.model_validate(c) for c in profile.credentials]
    )


@router.get("/{id}", response_model=ResponseModel[ProfessionalProfileResponse])
async def get_professional_by_id(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ProfessionalProfile)
        .where(ProfessionalProfile.id == id)
        .options(selectinload(ProfessionalProfile.credentials))
    )
    profile = await db.scalar(stmt)
    if not profile:
        raise ResourceNotFoundException("Professional profile not found")

    return ResponseModel(
        data=ProfessionalProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            display_name=profile.display_name,
            title=profile.title,
            biography=profile.biography,
            country_code=profile.country_code,
            hourly_rate=profile.hourly_rate,
            currency_code=profile.currency_code,
            skills=profile.skills,
            professional_status=profile.professional_status,
            verification_status=profile.verification_status,
            rating_average=profile.rating_average,
            total_reviews_count=profile.total_reviews_count,
            created_at=profile.created_at,
            credentials=[
                CredentialResponse.model_validate(c)
                for c in profile.credentials
                if c.verification_status == "verified"  # Public only sees verified credentials
            ],
        )
    )
