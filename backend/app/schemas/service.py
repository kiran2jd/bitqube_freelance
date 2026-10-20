import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    category_id: uuid.UUID
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20)
    price_type: str = Field(default="fixed", pattern="^(fixed|hourly)$")
    base_price: Decimal = Field(..., gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    delivery_days: int = Field(default=7, ge=1, le=365)


class ServiceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=200)
    description: str | None = Field(default=None, min_length=20)
    price_type: str | None = Field(default=None, pattern="^(fixed|hourly)$")
    base_price: Decimal | None = Field(default=None, gt=0)
    delivery_days: int | None = Field(default=None, ge=1, le=365)
    status: str | None = Field(default=None, pattern="^(draft|active|paused|archived)$")


class ServiceResponse(BaseModel):
    id: uuid.UUID
    professional_id: uuid.UUID
    category_id: uuid.UUID
    title: str
    description: str
    price_type: str
    base_price: Decimal
    currency_code: str
    delivery_days: int
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
