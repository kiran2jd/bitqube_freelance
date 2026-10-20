import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.models.ledger import LedgerEntry
from app.models.professional import ProfessionalCredential, ProfessionalProfile
from app.models.user import UserRole


async def create_user_with_token(
    client: AsyncClient,
    db_session: AsyncSession,
    email: str,
    role: str = "customer",
    first_name: str = "Test",
    last_name: str = "User",
) -> tuple[dict, str]:
    reg_role = "professional" if role == "professional" else "customer"
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "first_name": first_name,
            "last_name": last_name,
            "role": reg_role,
            "country_code": "IN",
            "preferred_currency": "INR",
            "terms_accepted": True,
        },
    )
    assert resp.status_code == 201
    user_data = resp.json()["data"]["user"]

    if role == "administrator":
        db_session.add(UserRole(user_id=uuid.UUID(user_data["id"]), role="administrator"))
        await db_session.commit()

    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    return user_data, token


@pytest.mark.asyncio
async def test_admin_metrics_access_control(client: AsyncClient, db_session: AsyncSession):
    # Customer user
    cust, cust_token = await create_user_with_token(client, db_session, "reg_cust@bitqube.org", "customer")
    # Admin user
    adm, adm_token = await create_user_with_token(client, db_session, "super_admin@bitqube.org", "administrator")

    # Customer tries accessing admin metrics -> 403 Forbidden
    res_forbidden = await client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert res_forbidden.status_code == 403

    # Admin accesses metrics -> 200 OK
    res_ok = await client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {adm_token}"},
    )
    assert res_ok.status_code == 200
    data = res_ok.json()["data"]
    assert "total_users" in data
    assert "total_contracts" in data
    assert "platform_commission_revenue" in data


@pytest.mark.asyncio
async def test_admin_credential_review_queue(client: AsyncClient, db_session: AsyncSession):
    # Create professional
    prof_user, prof_token = await create_user_with_token(client, db_session, "prof_law@bitqube.org", "professional")
    adm_user, adm_token = await create_user_with_token(client, db_session, "admin_cred@bitqube.org", "administrator")

    # Fetch or update professional profile and pending credential
    stmt_p = select(ProfessionalProfile).where(ProfessionalProfile.user_id == prof_user["id"])
    profile = await db_session.scalar(stmt_p)
    if not profile:
        profile = ProfessionalProfile(
            user_id=prof_user["id"],
            display_name="Adv. Ramesh Kumar",
            title="High Court Advocate",
            biography="Experienced constitutional and corporate lawyer.",
            country_code="IN",
            hourly_rate=Decimal("4000.00"),
            currency_code="INR",
            verification_status="pending",
        )
        db_session.add(profile)
        await db_session.flush()
    else:
        profile.display_name = "Adv. Ramesh Kumar"
        profile.title = "High Court Advocate"
        profile.verification_status = "pending"
        await db_session.flush()

    cred = ProfessionalCredential(
        professional_id=profile.id,
        title="Bar License",
        issuing_organization="Bar Council of Delhi",
        credential_identifier="D/1234/2012",
        verification_status="pending",
    )
    db_session.add(cred)
    await db_session.commit()

    # Admin views pending credentials
    list_resp = await client.get(
        "/api/v1/admin/credentials/pending",
        headers={"Authorization": f"Bearer {adm_token}"},
    )
    assert list_resp.status_code == 200
    pending_items = list_resp.json()["data"]
    assert any(c["id"] == str(cred.id) for c in pending_items)

    # Admin approves the credential
    review_resp = await client.post(
        f"/api/v1/admin/credentials/{cred.id}/review",
        headers={"Authorization": f"Bearer {adm_token}"},
        json={"status": "verified"},
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["data"]["verification_status"] == "verified"

    # Verify profile was promoted to verified
    await db_session.refresh(profile)
    assert profile.verification_status == "verified"


@pytest.mark.asyncio
async def test_dispute_creation_and_admin_resolution(client: AsyncClient, db_session: AsyncSession):
    # Customer, Professional, Admin
    cust_user, cust_token = await create_user_with_token(client, db_session, "client_disp@bitqube.org", "customer")
    prof_user, prof_token = await create_user_with_token(client, db_session, "prof_disp@bitqube.org", "professional")
    adm_user, adm_token = await create_user_with_token(client, db_session, "admin_disp@bitqube.org", "administrator")

    category = (await db_session.scalars(select(Category))).first()
    assert category

    # Post project
    p_resp = await client.post(
        "/api/v1/projects",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={
            "title": "Dispute Contract Test Project",
            "description": "Testing dispute resolution pipeline.",
            "category_id": str(category.id),
            "budget_min": 10000,
            "budget_max": 15000,
            "currency_code": "INR",
            "deadline": "2026-12-31T23:59:59Z",
        },
    )
    project_id = p_resp.json()["data"]["id"]

    # Professional profile
    stmt_prof = select(ProfessionalProfile).where(ProfessionalProfile.user_id == prof_user["id"])
    prof_profile = await db_session.scalar(stmt_prof)
    if not prof_profile:
        prof_profile = ProfessionalProfile(
            user_id=prof_user["id"],
            display_name="Dev Specialist",
            title="Web Developer",
            biography="Developer bio",
            country_code="IN",
            currency_code="INR",
            verification_status="verified",
        )
        db_session.add(prof_profile)
    else:
        prof_profile.verification_status = "verified"
    await db_session.commit()

    # Submit proposal
    prop_resp = await client.post(
        "/api/v1/proposals",
        headers={"Authorization": f"Bearer {prof_token}"},
        json={
            "project_id": project_id,
            "amount": 12000,
            "currency_code": "INR",
            "estimated_duration_days": 10,
            "cover_letter": "I will deliver according to requirements.",
            "milestones": [
                {
                    "title": "Phase 1 Delivery",
                    "description": "Initial delivery",
                    "amount": 12000,
                    "currency_code": "INR",
                    "due_at": "2026-12-15T00:00:00Z",
                }
            ],
        },
    )
    proposal_id = prop_resp.json()["data"]["id"]

    # Customer accepts proposal -> creates contract
    acc_resp = await client.post(
        f"/api/v1/proposals/{proposal_id}/accept",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    contract_data = acc_resp.json()["data"]
    contract_id = contract_data["id"]
    milestone_id = contract_data["milestones"][0]["id"]

    # Customer funds milestone
    fund_resp = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/fund",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert fund_resp.status_code == 200

    # Customer lodges dispute
    disp_resp = await client.post(
        "/api/v1/disputes",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={
            "contract_id": contract_id,
            "milestone_id": milestone_id,
            "reason": "Quality Breach",
            "description": "The submitted work does not meet agreed quality specifications.",
        },
    )
    assert disp_resp.status_code == 201
    dispute_id = disp_resp.json()["data"]["id"]

    # Admin views disputes
    admin_list = await client.get(
        "/api/v1/admin/disputes",
        headers={"Authorization": f"Bearer {adm_token}"},
    )
    assert admin_list.status_code == 200
    assert any(d["id"] == dispute_id for d in admin_list.json()["data"])

    # Admin resolves dispute with refund to customer
    resolve_resp = await client.post(
        f"/api/v1/admin/disputes/{dispute_id}/resolve",
        headers={"Authorization": f"Bearer {adm_token}"},
        json={
            "action": "refund_customer",
            "resolution_notes": "Inspection confirms deliverable failure. Refund approved.",
        },
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["data"]["status"] == "resolved_refund"

    # Verify ledger refund entry was posted
    refund_ledger = (
        await db_session.scalars(
            select(LedgerEntry).where(
                LedgerEntry.description.ilike("%Admin dispute refund%")
            )
        )
    ).all()
    assert len(refund_ledger) >= 1


@pytest.mark.asyncio
async def test_admin_feature_flags_and_audit_logs(client: AsyncClient, db_session: AsyncSession):
    adm_user, adm_token = await create_user_with_token(client, db_session, "admin_audit@bitqube.org", "administrator")

    # List feature flags
    flags_resp = await client.get(
        "/api/v1/admin/feature-flags",
        headers={"Authorization": f"Bearer {adm_token}"},
    )
    assert flags_resp.status_code == 200
    flags = flags_resp.json()["data"]
    assert any(f["key"] == "btq_payments_enabled" for f in flags)

    # Toggle a feature flag
    patch_resp = await client.patch(
        "/api/v1/admin/feature-flags/btq_payments_enabled",
        headers={"Authorization": f"Bearer {adm_token}"},
        json={"value": True, "description": "Temporary staging test toggle"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["value"] is True

    # Revert flag to false (preserving fiat-only MVP constraint)
    revert_resp = await client.patch(
        "/api/v1/admin/feature-flags/btq_payments_enabled",
        headers={"Authorization": f"Bearer {adm_token}"},
        json={"value": False, "description": "Enforces strict fiat MVP"},
    )
    assert revert_resp.status_code == 200
    assert revert_resp.json()["data"]["value"] is False

    # Check audit logs
    audit_resp = await client.get(
        "/api/v1/admin/audit-logs",
        headers={"Authorization": f"Bearer {adm_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()["data"]
    assert any("feature_flag" in log_item["action"] for log_item in logs)
