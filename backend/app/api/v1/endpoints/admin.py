import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_admin, get_db
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.audit import AuditLog
from app.models.contract import Contract
from app.models.dispute import Dispute
from app.models.governance import FeatureFlag
from app.models.ledger import LedgerEntry
from app.models.professional import ProfessionalCredential, ProfessionalProfile
from app.models.user import User, UserRole
from app.schemas.admin import (
    AuditLogResponse,
    CredentialReviewRequest,
    DisputeResponse,
    FeatureFlagResponse,
    PendingCredentialResponse,
    PlatformMetricsResponse,
    ResolveDisputeRequest,
    UpdateFeatureFlagRequest,
)
from app.schemas.base import ApiResponse
from app.services.audit_service import record_audit_log
from app.services.payment.ledger_service import ledger_service

router = APIRouter()


@router.get("/metrics", response_model=ApiResponse[PlatformMetricsResponse])
async def get_platform_metrics(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Returns high-level platform operational metrics and financial volume."""
    total_users = await db.scalar(select(func.count(User.id))) or 0
    total_clients = await db.scalar(
        select(func.count(UserRole.id)).where(UserRole.role == "customer")
    ) or 0
    total_professionals = await db.scalar(
        select(func.count(UserRole.id)).where(UserRole.role == "professional")
    ) or 0
    total_contracts = await db.scalar(select(func.count(Contract.id))) or 0

    total_gmv = await db.scalar(
        select(func.coalesce(func.sum(Contract.agreed_amount), Decimal("0.00")))
    ) or Decimal("0.00")

    # Platform revenue from ledger
    platform_revenue = await db.scalar(
        select(func.coalesce(func.sum(LedgerEntry.amount), Decimal("0.00")))
        .where(
            LedgerEntry.account_code == "PLATFORM_COMMISSION_REVENUE",
            LedgerEntry.entry_type == "CREDIT",
        )
    ) or Decimal("0.00")

    pending_verifications = await db.scalar(
        select(func.count(ProfessionalCredential.id))
        .where(ProfessionalCredential.verification_status == "pending")
    ) or 0

    open_disputes = await db.scalar(
        select(func.count(Dispute.id))
        .where(Dispute.status.in_(["opened", "under_investigation"]))
    ) or 0

    return ApiResponse.ok(
        data=PlatformMetricsResponse(
            total_users=total_users,
            total_clients=total_clients,
            total_professionals=total_professionals,
            total_contracts=total_contracts,
            total_gmv=total_gmv,
            platform_commission_revenue=platform_revenue,
            pending_verifications=pending_verifications,
            open_disputes=open_disputes,
        )
    )


@router.get("/credentials/pending", response_model=ApiResponse[list[PendingCredentialResponse]])
async def list_pending_credentials(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all professional credentials awaiting administrative review."""
    stmt = (
        select(ProfessionalCredential)
        .where(ProfessionalCredential.verification_status == "pending")
        .options(
            selectinload(ProfessionalCredential.professional).selectinload(ProfessionalProfile.user)
        )
        .order_by(ProfessionalCredential.created_at.asc())
    )
    credentials = (await db.scalars(stmt)).all()

    items = [
        PendingCredentialResponse(
            id=c.id,
            professional_id=c.professional_id,
            user_id=c.professional.user_id,
            professional_name=c.professional.display_name,
            professional_email=c.professional.user.email,
            title=c.title,
            issuing_organization=c.issuing_organization,
            credential_identifier=c.credential_identifier,
            document_id=c.document_id,
            verification_status=c.verification_status,
            created_at=c.created_at,
        )
        for c in credentials
    ]
    return ApiResponse.ok(data=items)


@router.post("/credentials/{credential_id}/review", response_model=ApiResponse[PendingCredentialResponse])
async def review_credential(
    credential_id: uuid.UUID,
    payload: CredentialReviewRequest,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Approves or rejects a submitted professional credential."""
    stmt = (
        select(ProfessionalCredential)
        .where(ProfessionalCredential.id == credential_id)
        .options(
            selectinload(ProfessionalCredential.professional).selectinload(ProfessionalProfile.user)
        )
    )
    cred = await db.scalar(stmt)
    if not cred:
        raise NotFoundException("Credential not found")

    cred.verification_status = payload.status
    if payload.status == "verified":
        cred.verified_at = datetime.now(UTC)
        # Check if professional has any remaining pending or rejected credentials;
        # if verified, set professional profile to verified
        profile = cred.professional
        profile.verification_status = "verified"
    else:
        # If rejected
        profile = cred.professional
        profile.verification_status = "rejected"

    await record_audit_log(
        db=db,
        action=f"admin.credential_{payload.status}",
        entity_type="credential",
        entity_id=cred.id,
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        metadata={
            "professional_id": str(cred.professional_id),
            "credential_title": cred.title,
            "status": payload.status,
            "rejection_reason": payload.rejection_reason,
        },
    )

    await db.commit()
    await db.refresh(cred)

    return ApiResponse.ok(
        data=PendingCredentialResponse(
            id=cred.id,
            professional_id=cred.professional_id,
            user_id=cred.professional.user_id,
            professional_name=cred.professional.display_name,
            professional_email=cred.professional.user.email,
            title=cred.title,
            issuing_organization=cred.issuing_organization,
            credential_identifier=cred.credential_identifier,
            document_id=cred.document_id,
            verification_status=cred.verification_status,
            created_at=cred.created_at,
        ),
        message=f"Credential successfully marked as {payload.status}",
    )


@router.get("/disputes", response_model=ApiResponse[list[DisputeResponse]])
async def list_admin_disputes(
    status_filter: str | None = None,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all marketplace disputes for administrative investigation and adjudication."""
    stmt = (
        select(Dispute)
        .options(selectinload(Dispute.raised_by))
        .order_by(Dispute.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(Dispute.status == status_filter)

    disputes = (await db.scalars(stmt)).all()
    items = [
        DisputeResponse(
            id=d.id,
            contract_id=d.contract_id,
            milestone_id=d.milestone_id,
            raised_by_id=d.raised_by_id,
            raised_by_name=f"{d.raised_by.first_name} {d.raised_by.last_name}" if d.raised_by else None,
            reason=d.reason,
            description=d.description,
            status=d.status,
            resolution_notes=d.resolution_notes,
            resolved_by=d.resolved_by,
            resolved_at=d.resolved_at,
            created_at=d.created_at,
        )
        for d in disputes
    ]
    return ApiResponse.ok(data=items)


@router.post("/disputes/{dispute_id}/resolve", response_model=ApiResponse[DisputeResponse])
async def resolve_dispute(
    dispute_id: uuid.UUID,
    payload: ResolveDisputeRequest,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Adjudicates a dispute with authoritative ledger reallocation."""
    stmt = (
        select(Dispute)
        .where(Dispute.id == dispute_id)
        .options(
            selectinload(Dispute.milestone),
            selectinload(Dispute.contract),
            selectinload(Dispute.raised_by),
        )
    )
    dispute = await db.scalar(stmt)
    if not dispute:
        raise NotFoundException("Dispute not found")

    if dispute.status.startswith("resolved"):
        raise BadRequestException("Dispute has already been resolved")

    milestone = dispute.milestone

    if payload.action == "refund_customer":
        dispute.status = "resolved_refund"
        if milestone and milestone.status in ("funded", "submitted", "disputed"):
            milestone.status = "disputed"
            # Execute ledger refund if milestone was funded
            await ledger_service.record_milestone_refund(
                db=db,
                payment_id=None,
                amount=milestone.amount,
                currency_code=milestone.currency_code,
                description=f"Admin dispute refund resolved: {payload.resolution_notes}",
            )
    elif payload.action == "release_to_professional":
        dispute.status = "resolved_release"
        if milestone and milestone.status in ("funded", "submitted", "disputed"):
            milestone.status = "approved"
            milestone.approved_at = datetime.now(UTC)
            platform_fee = round(milestone.amount * Decimal("0.10"), 2)
            # Execute ledger release: 90% professional, 10% platform
            await ledger_service.record_milestone_released(
                db=db,
                payment_id=None,
                amount=milestone.amount,
                platform_fee=platform_fee,
                currency_code=milestone.currency_code,
                description=f"Admin dispute release authorized: {payload.resolution_notes}",
            )
    else:
        dispute.status = "dismissed"

    dispute.resolution_notes = payload.resolution_notes
    dispute.resolved_by = admin_user.id
    dispute.resolved_at = datetime.now(UTC)

    await record_audit_log(
        db=db,
        action=f"admin.dispute_{payload.action}",
        entity_type="dispute",
        entity_id=dispute.id,
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        metadata={
            "contract_id": str(dispute.contract_id),
            "milestone_id": str(dispute.milestone_id) if dispute.milestone_id else None,
            "action": payload.action,
            "resolution_notes": payload.resolution_notes,
        },
    )

    await db.commit()
    await db.refresh(dispute)

    return ApiResponse.ok(
        data=DisputeResponse(
            id=dispute.id,
            contract_id=dispute.contract_id,
            milestone_id=dispute.milestone_id,
            raised_by_id=dispute.raised_by_id,
            raised_by_name=f"{dispute.raised_by.first_name} {dispute.raised_by.last_name}" if dispute.raised_by else None,
            reason=dispute.reason,
            description=dispute.description,
            status=dispute.status,
            resolution_notes=dispute.resolution_notes,
            resolved_by=dispute.resolved_by,
            resolved_at=dispute.resolved_at,
            created_at=dispute.created_at,
        ),
        message=f"Dispute resolved with action '{payload.action}'",
    )


@router.get("/feature-flags", response_model=ApiResponse[list[FeatureFlagResponse]])
async def list_feature_flags(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Lists all platform feature flags and ecosystem toggles."""
    stmt = select(FeatureFlag).order_by(FeatureFlag.key.asc())
    flags = (await db.scalars(stmt)).all()
    items = [FeatureFlagResponse.model_validate(f) for f in flags]
    return ApiResponse.ok(data=items)


@router.patch("/feature-flags/{key}", response_model=ApiResponse[FeatureFlagResponse])
async def update_feature_flag(
    key: str,
    payload: UpdateFeatureFlagRequest,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Toggles or updates a platform feature flag."""
    stmt = select(FeatureFlag).where(FeatureFlag.key == key)
    flag = await db.scalar(stmt)
    if not flag:
        raise NotFoundException("Feature flag not found")

    old_val = flag.value
    flag.value = payload.value
    if payload.description:
        flag.description = payload.description

    await record_audit_log(
        db=db,
        action="admin.feature_flag_updated",
        entity_type="feature_flag",
        entity_id=None,
        actor_id=admin_user.id,
        ip_address=request.client.host if request.client else None,
        metadata={"key": key, "old_value": old_val, "new_value": payload.value},
    )

    await db.commit()
    await db.refresh(flag)
    return ApiResponse.ok(
        data=FeatureFlagResponse.model_validate(flag),
        message=f"Feature flag '{key}' updated successfully",
    )


@router.get("/audit-logs", response_model=ApiResponse[list[AuditLogResponse]])
async def list_audit_logs(
    limit: int = 50,
    action: str | None = None,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Queries administrative and security audit trail records."""
    stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.actor))
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    if action:
        stmt = stmt.where(AuditLog.action == action)

    logs = (await db.scalars(stmt)).all()
    items = [
        AuditLogResponse(
            id=log_entry.id,
            actor_id=log_entry.actor_id,
            actor_email=log_entry.actor.email if log_entry.actor else None,
            action=log_entry.action,
            entity_type=log_entry.entity_type,
            entity_id=log_entry.entity_id,
            ip_address=str(log_entry.ip_address) if log_entry.ip_address else None,
            metadata=log_entry.metadata_,
            created_at=log_entry.created_at,
        )
        for log_entry in logs
    ]
    return ApiResponse.ok(data=items)
