import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class CredentialReviewRequest(BaseModel):
    status: Literal["verified", "rejected"]
    rejection_reason: str | None = None


class PendingCredentialResponse(BaseModel):
    id: uuid.UUID
    professional_id: uuid.UUID
    user_id: uuid.UUID
    professional_name: str
    professional_email: str
    title: str
    issuing_organization: str
    credential_identifier: str | None = None
    document_id: uuid.UUID | None = None
    verification_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateDisputeRequest(BaseModel):
    contract_id: uuid.UUID
    milestone_id: uuid.UUID | None = None
    reason: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=10)


class DisputeResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    milestone_id: uuid.UUID | None = None
    raised_by_id: uuid.UUID
    raised_by_name: str | None = None
    reason: str
    description: str
    status: str
    resolution_notes: str | None = None
    resolved_by: uuid.UUID | None = None
    resolved_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResolveDisputeRequest(BaseModel):
    action: Literal["refund_customer", "release_to_professional", "dismiss"]
    resolution_notes: str = Field(min_length=5)


class PlatformMetricsResponse(BaseModel):
    total_users: int
    total_clients: int
    total_professionals: int
    total_contracts: int
    total_gmv: Decimal
    platform_commission_revenue: Decimal
    pending_verifications: int
    open_disputes: int


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None = None
    actor_email: str | None = None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None = None
    ip_address: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UpdateFeatureFlagRequest(BaseModel):
    value: bool
    description: str | None = None


class FeatureFlagResponse(BaseModel):
    key: str
    value: bool
    description: str | None = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
