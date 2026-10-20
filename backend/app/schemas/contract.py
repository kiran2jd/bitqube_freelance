import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MilestoneResponse(BaseModel):
    id: uuid.UUID
    contract_id: uuid.UUID
    title: str
    description: str
    amount: Decimal
    currency_code: str
    due_at: datetime
    status: str
    submitted_at: datetime | None = None
    approved_at: datetime | None = None
    deliverable_notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MilestoneDeliverableSubmit(BaseModel):
    deliverable_notes: str = Field(min_length=10)


class MilestoneApproveRequest(BaseModel):
    confirmed: bool = True


class ContractResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    proposal_id: uuid.UUID
    customer_id: uuid.UUID
    professional_id: uuid.UUID
    agreed_amount: Decimal
    currency_code: str
    terms_version: str
    status: str
    accepted_at: datetime
    completed_at: datetime | None = None
    created_at: datetime
    project_title: str | None = None
    customer_name: str | None = None
    professional_name: str | None = None
    milestones: list[MilestoneResponse] = []

    model_config = ConfigDict(from_attributes=True)
