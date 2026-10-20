import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CredentialCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    issuing_organization: str = Field(..., min_length=2, max_length=200)
    credential_identifier: str | None = Field(default=None, max_length=100)
    document_id: uuid.UUID | None = None


class CredentialResponse(BaseModel):
    id: uuid.UUID
    professional_id: uuid.UUID
    title: str
    issuing_organization: str
    credential_identifier: str | None = None
    document_id: uuid.UUID | None = None
    verification_status: str
    verified_at: datetime | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProfessionalProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=150)
    title: str | None = Field(default=None, min_length=2, max_length=200)
    biography: str | None = Field(default=None, min_length=10)
    country_code: str | None = Field(default=None, min_length=2, max_length=2)
    hourly_rate: Decimal | None = Field(default=None, ge=0)
    currency_code: str | None = Field(default=None, min_length=3, max_length=3)
    skills: list[str] | None = None
    professional_status: str | None = Field(default=None, pattern="^(available|busy|inactive)$")


class ProfessionalProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    display_name: str
    title: str
    biography: str
    country_code: str
    hourly_rate: Decimal | None = None
    currency_code: str
    skills: list[str]
    professional_status: str
    verification_status: str
    rating_average: Decimal
    total_reviews_count: int
    created_at: datetime
    credentials: list[CredentialResponse] = []
    model_config = ConfigDict(from_attributes=True)
