import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProjectCreate(BaseModel):
    category_id: uuid.UUID
    title: str = Field(min_length=5, max_length=250)
    description: str = Field(min_length=20)
    budget_min: Decimal | None = Field(default=None, ge=0)
    budget_max: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    deadline: datetime


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=250)
    description: str | None = Field(default=None, min_length=20)
    budget_min: Decimal | None = Field(default=None, ge=0)
    budget_max: Decimal | None = Field(default=None, gt=0)
    deadline: datetime | None = None
    status: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    category_id: uuid.UUID
    title: str
    description: str
    budget_min: Decimal | None
    budget_max: Decimal
    currency_code: str
    deadline: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    category_name: str | None = None
    customer_name: str | None = None
    proposals_count: int = 0

    model_config = ConfigDict(from_attributes=True)
