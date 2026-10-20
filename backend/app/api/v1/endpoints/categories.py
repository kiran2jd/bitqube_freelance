
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResourceNotFoundException
from app.db.session import get_db
from app.models.category import Category
from app.schemas.base import ResponseModel
from app.schemas.category import CategoryResponse

router = APIRouter()


@router.get("", response_model=ResponseModel[list[CategoryResponse]])
async def list_categories(db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Category)
        .where(Category.is_active.is_(True))
        .order_by(Category.sort_order.asc())
    )
    result = await db.scalars(stmt)
    categories = result.all()
    return ResponseModel(
        data=[CategoryResponse.model_validate(c) for c in categories]
    )


@router.get("/{slug}", response_model=ResponseModel[CategoryResponse])
async def get_category_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Category).where(Category.slug == slug, Category.is_active.is_(True))
    category = await db.scalar(stmt)
    if not category:
        raise ResourceNotFoundException(f"Category with slug '{slug}' not found")
    return ResponseModel(data=CategoryResponse.model_validate(category))
