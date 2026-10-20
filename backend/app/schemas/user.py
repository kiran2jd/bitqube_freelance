import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    status: str
    country_code: str
    preferred_currency: str
    roles: list[str]
    is_mfa_enabled: bool
    email_verified_at: datetime | None = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    preferred_currency: str | None = Field(default=None, min_length=3, max_length=3)
