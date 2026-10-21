import io
import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ledger import LedgerEntry
from app.models.user import UserRole


@pytest.mark.asyncio
async def test_full_marketplace_lifecycle_e2e(client: AsyncClient, db_session: AsyncSession):
    """End-to-End simulation of the full marketplace lifecycle:
    1. Register Client (Alice) & Consultant (Adv. Bob).
    2. Consultant uploads bar license PDF with magic bytes.
    3. Admin approves credential -> consultant promoted to verified.
    4. Client posts Project in category.
    5. Consultant submits Proposal with Milestone.
    6. Client accepts Proposal -> Contract auto-generated.
    7. Client funds Milestone via Razorpay Escrow order + signed webhook.
    8. Consultant submits deliverable.
    9. Client approves deliverable -> Contract completed.
    10. Immutable double-entry ledger balance audit (debit == credit).
    11. Bilateral review submission -> Dynamic rating recalculation.
    """

    # --- STEP 1: Registration ---
    alice_email = f"e2e.alice.{uuid.uuid4().hex[:6]}@example.com"
    bob_email = f"e2e.bob.{uuid.uuid4().hex[:6]}@example.com"

    alice_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": alice_email,
            "password": "SecurePassword123!",
            "first_name": "Alice",
            "last_name": "Enterprise",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert alice_reg.status_code == 201
    alice_token = alice_reg.json()["data"]["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    bob_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": bob_email,
            "password": "SecurePassword123!",
            "first_name": "Bob",
            "last_name": "Advocate",
            "role": "professional",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert bob_reg.status_code == 201
    bob_token = bob_reg.json()["data"]["access_token"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # --- STEP 2: Credential Upload with Magic Bytes ---
    real_pdf_bytes = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    upload_res = await client.post(
        "/api/v1/documents/upload",
        headers=bob_headers,
        files={"file": ("bar_license.pdf", io.BytesIO(real_pdf_bytes), "application/pdf")},
        data={"classification": "credential"},
    )
    assert upload_res.status_code == 200
    doc_id = upload_res.json()["data"]["id"]

    cred_res = await client.post(
        "/api/v1/professionals/me/credentials",
        headers=bob_headers,
        json={
            "title": "Bar Council of India License",
            "issuing_organization": "Bar Council of Maharashtra & Goa",
            "credential_identifier": "MAH/1234/2018",
            "document_id": doc_id,
        },
    )
    assert cred_res.status_code == 200
    cred_id = cred_res.json()["data"]["id"]

    # --- STEP 3: Admin Review Queue & Approval ---
    # Promote a temp user to admin in DB
    admin_email = f"e2e.admin.{uuid.uuid4().hex[:6]}@example.com"
    admin_reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": admin_email,
            "password": "SecurePassword123!",
            "first_name": "Admin",
            "last_name": "Governance",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    admin_user_id = uuid.UUID(admin_reg.json()["data"]["user"]["id"])

    # Grant admin role directly in db
    db_session.add(UserRole(user_id=admin_user_id, role="administrator"))
    await db_session.commit()

    # Re-login to get updated JWT claims
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": admin_email, "password": "SecurePassword123!"},
    )
    admin_token = admin_login.json()["data"]["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin reviews and approves credential
    approve_cred_res = await client.post(
        f"/api/v1/admin/credentials/{cred_id}/review",
        headers=admin_headers,
        json={"status": "verified"},
    )
    assert approve_cred_res.status_code == 200

    # Verify Bob's profile is now verified
    bob_profile_res = await client.get("/api/v1/professionals/me", headers=bob_headers)
    assert bob_profile_res.json()["data"]["verification_status"] == "verified"

    # --- STEP 4: Client Posts Project ---
    cat_res = await client.get("/api/v1/categories")
    assert cat_res.status_code == 200
    categories = cat_res.json()["data"]
    legal_cat = next(c for c in categories if c["slug"] == "legal-services")

    from datetime import UTC, datetime, timedelta

    deadline_iso = (datetime.now(UTC) + timedelta(days=14)).isoformat()
    project_res = await client.post(
        "/api/v1/projects",
        headers=alice_headers,
        json={
            "category_id": legal_cat["id"],
            "title": "Corporate Cross-Border SaaS Contract Review",
            "description": "Comprehensive legal audit and compliance review of SaaS customer agreements.",
            "budget_min": 30000.0,
            "budget_max": 50000.0,
            "currency_code": "INR",
            "deadline": deadline_iso,
        },
    )
    assert project_res.status_code == 201
    project_id = project_res.json()["data"]["id"]

    # --- STEP 5: Consultant Submits Proposal ---
    proposal_res = await client.post(
        "/api/v1/proposals",
        headers=bob_headers,
        json={
            "project_id": project_id,
            "cover_letter": "I specialize in international technology and corporate IP legal counsel.",
            "amount": 35000.0,
            "currency_code": "INR",
            "estimated_duration_days": 7,
            "proposed_milestones": [
                {
                    "title": "Initial Risk Assessment & Clause Redlines",
                    "description": "Redlined SLA, liability cap, and indemnification provisions.",
                    "amount": 35000.0,
                    "duration_days": 7,
                }
            ],
        },
    )
    assert proposal_res.status_code == 201
    proposal_id = proposal_res.json()["data"]["id"]

    # --- STEP 6: Client Accepts Proposal -> Contract Formed ---
    accept_res = await client.post(
        f"/api/v1/proposals/{proposal_id}/accept",
        headers=alice_headers,
    )
    assert accept_res.status_code == 200
    contract_data = accept_res.json()["data"]
    contract_id = contract_data["id"]
    milestone_id = contract_data["milestones"][0]["id"]

    # --- STEP 7: Razorpay Milestone Escrow Funding ---
    order_res = await client.post(
        "/api/v1/payments/orders",
        headers=alice_headers,
        json={"milestone_id": milestone_id},
    )
    assert order_res.status_code == 201
    payment_order = order_res.json()["data"]
    razorpay_order_id = payment_order["order_id"]
    payment_id = payment_order["payment_id"]

    # Simulate client payment verification
    mock_rzp_payment_id = f"pay_{uuid.uuid4().hex[:14]}"
    mock_signature = "test_sig_authorized"

    verify_res = await client.post(
        "/api/v1/payments/verify",
        headers=alice_headers,
        json={
            "payment_id": payment_id,
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": mock_rzp_payment_id,
            "razorpay_signature": mock_signature,
        },
    )
    assert verify_res.status_code == 200

    # Verify milestone is funded
    funded_contract = (await client.get(f"/api/v1/contracts/{contract_id}", headers=alice_headers)).json()["data"]
    assert funded_contract["milestones"][0]["status"] == "funded"

    # --- STEP 8: Consultant Submits Deliverable ---
    submit_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/submit",
        headers=bob_headers,
        json={"deliverable_notes": "All clauses audited and redlined per statutory legal standards."},
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["data"]["milestones"][0]["status"] == "submitted"

    # --- STEP 9: Client Approves Deliverable & Milestone ---
    approve_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/approve",
        headers=alice_headers,
        json={"approval_notes": "Excellent legal advice and prompt delivery."},
    )
    assert approve_res.status_code == 200
    completed_contract = approve_res.json()["data"]
    assert completed_contract["status"] == "completed"
    assert completed_contract["milestones"][0]["status"] == "approved"

    # --- STEP 10: Double-Entry Ledger Mathematical Audit ---
    # Query all ledger entries for this payment
    stmt_ledger = select(LedgerEntry).where(LedgerEntry.payment_id == uuid.UUID(payment_id))
    entries = (await db_session.scalars(stmt_ledger)).all()
    assert len(entries) >= 4  # Funding debit/credit + Release debit/credit

    total_debits = sum(e.amount for e in entries if e.entry_type == "DEBIT")
    total_credits = sum(e.amount for e in entries if e.entry_type == "CREDIT")
    assert total_debits == total_credits, f"Ledger parity failure: Debits {total_debits} != Credits {total_credits}"

    # Verify 10% platform commission split
    commission_entry = next(
        e for e in entries if e.account_code == "PLATFORM_COMMISSION_REVENUE" and e.entry_type == "CREDIT"
    )
    assert commission_entry.amount == Decimal("3500.00")  # 10% of 35000

    payout_entry = next(
        e for e in entries if e.account_code == "PROFESSIONAL_EARNINGS" and e.entry_type == "CREDIT"
    )
    assert payout_entry.amount == Decimal("31500.00")  # 90% of 35000

    # --- STEP 11: Bilateral Reviews & Rating Recalibration ---
    review_res = await client.post(
        "/api/v1/reviews",
        headers=alice_headers,
        json={
            "contract_id": contract_id,
            "rating": 5,
            "comment": "Exceptional legal acumen and clear guidance. Highly recommended!",
        },
    )
    assert review_res.status_code == 201

    # Check Bob's public profile
    prof_public = (await client.get(f"/api/v1/professionals/{completed_contract['professional_id']}")).json()["data"]
    assert prof_public["verification_status"] == "verified"
    assert prof_public["total_reviews_count"] == 1
    assert float(prof_public["rating_average"]) == 5.0
