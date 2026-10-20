from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_payment_order_verification_and_ledger_flow(client: AsyncClient):
    # 1. Fetch category
    cat_res = await client.get("/api/v1/categories")
    assert cat_res.status_code == 200
    category_id = cat_res.json()["data"][0]["id"]

    # 2. Register Customer
    cust_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "payer.client@example.com",
            "password": "SecurePassword123!",
            "first_name": "Kavita",
            "last_name": "Mehta",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert cust_res.status_code == 201
    cust_token = cust_res.json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Customer posts project
    deadline = (datetime.now(UTC) + timedelta(days=20)).isoformat()
    proj_res = await client.post(
        "/api/v1/projects",
        json={
            "category_id": category_id,
            "title": "Corporate Law Structuring & Cross-Border Advisory",
            "description": "Comprehensive review of enterprise contracts and tax liabilities for multi-currency operations.",
            "budget_min": 40000.0,
            "budget_max": 80000.0,
            "currency_code": "INR",
            "deadline": deadline,
        },
        headers=cust_headers,
    )
    assert proj_res.status_code == 201
    project_id = proj_res.json()["data"]["id"]

    # 4. Register Professional
    pro_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "payee.pro@example.com",
            "password": "SecurePassword123!",
            "first_name": "Vikram",
            "last_name": "Aditya",
            "role": "professional",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert pro_res.status_code == 201
    pro_token = pro_res.json()["data"]["access_token"]
    pro_headers = {"Authorization": f"Bearer {pro_token}"}

    # 5. Professional submits proposal
    bid_res = await client.post(
        "/api/v1/proposals",
        json={
            "project_id": project_id,
            "amount": 50000.0,
            "currency_code": "INR",
            "estimated_duration_days": 10,
            "cover_letter": "I will deliver comprehensive legal and tax advisory documentation tailored to Indian regulatory standards.",
        },
        headers=pro_headers,
    )
    assert bid_res.status_code == 201
    proposal_id = bid_res.json()["data"]["id"]

    # 6. Customer accepts proposal -> creates contract with pending milestone
    accept_res = await client.post(f"/api/v1/proposals/{proposal_id}/accept", headers=cust_headers)
    assert accept_res.status_code == 200
    contract_data = accept_res.json()["data"]
    contract_id = contract_data["id"]
    milestone_id = contract_data["milestones"][0]["id"]
    assert contract_data["milestones"][0]["status"] == "pending"

    # 7. Customer creates Razorpay payment order
    order_res = await client.post(
        "/api/v1/payments/orders",
        json={"milestone_id": milestone_id},
        headers=cust_headers,
    )
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    payment_id = order_data["payment_id"]
    order_id = order_data["order_id"]
    assert order_id.startswith("order_")
    assert order_data["amount"] == "50000.00"
    assert order_data["currency"] == "INR"

    # 8. Test invalid signature rejection
    bad_verify_res = await client.post(
        "/api/v1/payments/verify",
        json={
            "payment_id": payment_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": "pay_fake_123",
            "razorpay_signature": "invalid_signature_hash",
        },
        headers=cust_headers,
    )
    assert bad_verify_res.status_code == 400

    # 9. Verify payment with valid signature
    razorpay_payment_id = f"pay_{payment_id[:8]}"
    verify_res = await client.post(
        "/api/v1/payments/verify",
        json={
            "payment_id": payment_id,
            "razorpay_order_id": order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": "test_sig_authorized",
        },
        headers=cust_headers,
    )
    assert verify_res.status_code == 200
    verified_payment = verify_res.json()["data"]
    assert verified_payment["status"] == "confirmed"

    # 10. Verify milestone is now 'funded'
    contract_check = await client.get(f"/api/v1/contracts/{contract_id}", headers=cust_headers)
    assert contract_check.status_code == 200
    assert contract_check.json()["data"]["milestones"][0]["status"] == "funded"

    # 11. Verify Double-Entry Ledger entries for funding
    ledger_res = await client.get(f"/api/v1/payments/ledger?payment_id={payment_id}", headers=cust_headers)
    assert ledger_res.status_code == 200
    entries = ledger_res.json()["data"]
    assert len(entries) == 2

    receivable_entry = next(e for e in entries if e["account_code"] == "GATEWAY_SETTLEMENT_RECEIVABLE")
    held_entry = next(e for e in entries if e["account_code"] == "CUSTOMER_FUNDS_HELD")

    assert receivable_entry["entry_type"] == "DEBIT"
    assert receivable_entry["amount"] == "50000.00"
    assert held_entry["entry_type"] == "CREDIT"
    assert held_entry["amount"] == "50000.00"

    # 12. Professional submits deliverable
    sub_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/submit",
        json={"deliverable_notes": "All compliance reports and draft charters completed."},
        headers=pro_headers,
    )
    assert sub_res.status_code == 200

    # 13. Customer approves deliverable -> releases funds with 10% platform fee
    appr_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/approve",
        json={"confirmed": True},
        headers=cust_headers,
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["data"]["milestones"][0]["status"] == "approved"

    # 14. Verify updated general ledger for milestone release
    ledger_after = (await client.get(f"/api/v1/payments/ledger?payment_id={payment_id}", headers=cust_headers)).json()["data"]
    # Total 5 entries: 2 from funding + 3 from release
    assert len(ledger_after) == 5

    # Check the 3 release entries
    held_debit = next(e for e in ledger_after if e["account_code"] == "CUSTOMER_FUNDS_HELD" and e["entry_type"] == "DEBIT")
    pro_credit = next(e for e in ledger_after if e["account_code"] == "PROFESSIONAL_EARNINGS" and e["entry_type"] == "CREDIT")
    fee_credit = next(e for e in ledger_after if e["account_code"] == "PLATFORM_COMMISSION_REVENUE" and e["entry_type"] == "CREDIT")

    assert Decimal(held_debit["amount"]) == Decimal("50000.00")
    assert Decimal(pro_credit["amount"]) == Decimal("45000.00")  # 90%
    assert Decimal(fee_credit["amount"]) == Decimal("5000.00")   # 10%
    # Verify exact accounting balance: Debit == Credit Sum
    assert Decimal(held_debit["amount"]) == Decimal(pro_credit["amount"]) + Decimal(fee_credit["amount"])

    # 15. Check Invoice Generation
    inv_res = await client.get(f"/api/v1/payments/{payment_id}/invoice", headers=cust_headers)
    assert inv_res.status_code == 200
    invoice = inv_res.json()["data"]
    assert invoice["invoice_number"].startswith("INV-BTQ-")
    assert invoice["payer_name"] == "Kavita Mehta"
    assert invoice["payee_name"] == "Vikram Aditya"
    assert invoice["amount"] == "50000.00"
    assert invoice["platform_fee"] == "5000.00"
