import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProposedMilestoneItem(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=5)
    amount: Decimal = Field(gt=0)
    duration_days: int = Field(gt=0)


class ProposalCreate(BaseModel):
    project_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    estimated_duration_days: int = Field(gt=0)
    cover_letter: str = Field(min_length=20)
    proposed_milestones: list[ProposedMilestoneItem] | None = None


class ProposalResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    professional_id: uuid.UUID
    amount: Decimal
    currency_code: str
    estimated_duration_days: int
    cover_letter: str
    status: str
    created_at: datetime
    professional_name: str | None = None
    professional_title: str | None = None
    professional_rating: float | None = None
    is_verified: bool = False

    model_config = ConfigDict(from_attributes=True)
