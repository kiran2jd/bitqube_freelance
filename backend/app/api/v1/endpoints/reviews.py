import uuid
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_active_user, get_db
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.contract import Contract
from app.models.professional import ProfessionalProfile
from app.models.review import Review
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.review import ReviewCreate, ReviewResponse

router = APIRouter()


@router.post("", response_model=ApiResponse[ReviewResponse], status_code=201)
async def submit_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Submits a bilateral performance review for a completed contract."""
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

    if contract.status != "completed":
        raise BadRequestException(f"Cannot review a contract with status '{contract.status}'. Contract must be completed.")

    # Determine reviewer and reviewee
    is_customer = contract.customer_id == current_user.id
    is_professional = (
        current_user.professional_profile
        and contract.professional_id == current_user.professional_profile.id
    )

    if not is_customer and not is_professional:
        raise ForbiddenException("You are not a participant in this contract")

    if is_customer:
        reviewer_id = current_user.id
        reviewee_id = contract.professional.user_id
        target_profile_id = contract.professional_id
    else:
        reviewer_id = current_user.id
        reviewee_id = contract.customer_id
        target_profile_id = None

    # Check for existing review
    existing_stmt = select(Review).where(
        Review.contract_id == contract.id,
        Review.reviewer_id == reviewer_id,
    )
    if await db.scalar(existing_stmt):
        raise ConflictException("You have already submitted a review for this contract")

    review = Review(
        contract_id=contract.id,
        reviewer_id=reviewer_id,
        reviewee_id=reviewee_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    await db.flush()

    # If review is for professional, recalibrate rating on profile
    if target_profile_id:
        prof = await db.get(ProfessionalProfile, target_profile_id)
        if prof:
            agg_stmt = select(
                func.avg(Review.rating),
                func.count(Review.id),
            ).where(Review.reviewee_id == prof.user_id)
            avg_rating, count_reviews = (await db.execute(agg_stmt)).one()
            prof.rating_average = float(avg_rating) if avg_rating is not None else 5.0
            prof.total_reviews_count = int(count_reviews) if count_reviews is not None else 0

    await db.commit()
    await db.refresh(review)

    return ApiResponse.ok(
        data=ReviewResponse(
            id=review.id,
            contract_id=review.contract_id,
            reviewer_id=review.reviewer_id,
            reviewee_id=review.reviewee_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
            reviewer_name=f"{current_user.first_name} {current_user.last_name}",
        )
    )


@router.get("/user/{user_id}", response_model=ApiResponse[list[ReviewResponse]])
async def list_user_reviews(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists reviews received by a user."""
    stmt = (
        select(Review)
        .where(Review.reviewee_id == user_id)
        .options(selectinload(Review.reviewer))
        .order_by(Review.created_at.desc())
    )
    reviews = (await db.scalars(stmt)).all()

    items = [
        ReviewResponse(
            id=r.id,
            contract_id=r.contract_id,
            reviewer_id=r.reviewer_id,
            reviewee_id=r.reviewee_id,
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            reviewer_name=f"{r.reviewer.first_name} {r.reviewer.last_name}" if r.reviewer else None,
        )
        for r in reviews
    ]
    return ApiResponse.ok(data=items)
