import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    contract_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=10, max_length=2000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    rating: int
    comment: str
    created_at: datetime
    reviewer_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
