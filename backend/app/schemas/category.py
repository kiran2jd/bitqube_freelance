import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    slug: str = Field(..., max_length=120)
    description: str
    icon_name: str = Field(default="Sparkles", max_length=50)
    is_regulated: bool = False
    parent_id: uuid.UUID | None = None
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon_name: str | None = None
    is_regulated: bool | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class CategoryResponse(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
