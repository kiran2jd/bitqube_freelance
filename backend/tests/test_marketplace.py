from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_project_creation_and_listing(client: AsyncClient):
    # 1. Fetch available categories
    cat_res = await client.get("/api/v1/categories")
    assert cat_res.status_code == 200
    category_id = cat_res.json()["data"][0]["id"]

    # 2. Register customer
    cust_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust.project@example.com",
            "password": "SecurePassword123!",
            "first_name": "Sarah",
            "last_name": "Jenkins",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert cust_res.status_code == 201
    cust_token = cust_res.json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Create Project
    deadline = (datetime.now(UTC) + timedelta(days=14)).isoformat()
    project_payload = {
        "category_id": category_id,
        "title": "Corporate Legal Structure & Tax Optimization Advisory",
        "description": "Seeking expert corporate counsel to review our cross-border SaaS entity structure and GST compliance in India.",
        "budget_min": 25000.0,
        "budget_max": 60000.0,
        "currency_code": "INR",
        "deadline": deadline,
    }
    proj_res = await client.post("/api/v1/projects", json=project_payload, headers=cust_headers)
    assert proj_res.status_code == 201
    project_data = proj_res.json()["data"]
    assert project_data["title"] == project_payload["title"]
    assert project_data["status"] == "open"
    assert project_data["currency_code"] == "INR"
    project_id = project_data["id"]

    # 4. Public Project Listing
    list_res = await client.get("/api/v1/projects")
    assert list_res.status_code == 200
    projects = list_res.json()["data"]
    assert any(p["id"] == project_id for p in projects)

    # 5. Get Project by ID
    get_res = await client.get(f"/api/v1/projects/{project_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == project_id


@pytest.mark.asyncio
async def test_full_contract_milestone_and_review_lifecycle(client: AsyncClient):
    # 1. Fetch category
    cat_res = await client.get("/api/v1/categories")
    category_id = cat_res.json()["data"][1]["id"]

    # 2. Register Customer
    cust_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "cust.corp@example.com",
            "password": "SecurePassword123!",
            "first_name": "Rohan",
            "last_name": "Gupta",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert cust_res.status_code == 201
    cust_token = cust_res.json()["data"]["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Customer posts project
    deadline = (datetime.now(UTC) + timedelta(days=30)).isoformat()
    proj_res = await client.post(
        "/api/v1/projects",
        json={
            "category_id": category_id,
            "title": "Scalable Cloud Architecture Audit & Kubernetes Migration",
            "description": "We need a certified DevOps and Cloud architect to benchmark our infrastructure and deploy automated CI/CD pipelines.",
            "budget_min": 50000.0,
            "budget_max": 100000.0,
            "currency_code": "INR",
            "deadline": deadline,
        },
        headers=cust_headers,
    )
    assert proj_res.status_code == 201
    project_id = proj_res.json()["data"]["id"]

    # 4. Register Professional 1
    p1_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "expert.devops@example.com",
            "password": "SecurePassword123!",
            "first_name": "Priya",
            "last_name": "Sharma",
            "role": "professional",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert p1_res.status_code == 201
    p1_token = p1_res.json()["data"]["access_token"]
    p1_headers = {"Authorization": f"Bearer {p1_token}"}

    # 5. Register Professional 2
    p2_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "expert.devops2@example.com",
            "password": "SecurePassword123!",
            "first_name": "Anil",
            "last_name": "Kumar",
            "role": "professional",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert p2_res.status_code == 201
    p2_token = p2_res.json()["data"]["access_token"]
    p2_headers = {"Authorization": f"Bearer {p2_token}"}

    # 6. Professional 1 submits proposal
    p1_bid_res = await client.post(
        "/api/v1/proposals",
        json={
            "project_id": project_id,
            "amount": 75000.0,
            "currency_code": "INR",
            "estimated_duration_days": 10,
            "cover_letter": "I have over 10 years of experience migrating enterprise banking systems to Kubernetes with zero downtime.",
        },
        headers=p1_headers,
    )
    assert p1_bid_res.status_code == 201
    p1_proposal_id = p1_bid_res.json()["data"]["id"]

    # 7. Duplicate submission by Professional 1 should return 409 Conflict
    dup_res = await client.post(
        "/api/v1/proposals",
        json={
            "project_id": project_id,
            "amount": 70000.0,
            "currency_code": "INR",
            "estimated_duration_days": 8,
            "cover_letter": "Revised offer with immediate start.",
        },
        headers=p1_headers,
    )
    assert dup_res.status_code == 409

    # 8. Professional 2 submits proposal
    p2_bid_res = await client.post(
        "/api/v1/proposals",
        json={
            "project_id": project_id,
            "amount": 90000.0,
            "currency_code": "INR",
            "estimated_duration_days": 14,
            "cover_letter": "Senior DevOps practitioner specializing in AWS EKS and Terraform automation.",
        },
        headers=p2_headers,
    )
    assert p2_bid_res.status_code == 201
    p2_proposal_id = p2_bid_res.json()["data"]["id"]

    # 9. Customer reviews project proposals
    props_res = await client.get(f"/api/v1/projects/{project_id}/proposals", headers=cust_headers)
    assert props_res.status_code == 200
    assert len(props_res.json()["data"]) == 2

    # 10. Customer accepts Professional 1's proposal
    accept_res = await client.post(f"/api/v1/proposals/{p1_proposal_id}/accept", headers=cust_headers)
    assert accept_res.status_code == 200

    # Verify Professional 2's proposal was marked rejected
    p2_props = (await client.get(f"/api/v1/projects/{project_id}/proposals", headers=cust_headers)).json()["data"]
    p2_prop_found = next(p for p in p2_props if p["id"] == p2_proposal_id)
    assert p2_prop_found["status"] == "rejected"
    contract_data = accept_res.json()["data"]
    assert contract_data["status"] == "active"
    assert contract_data["agreed_amount"] == "75000.00"
    contract_id = contract_data["id"]
    assert len(contract_data["milestones"]) == 1
    milestone_id = contract_data["milestones"][0]["id"]
    assert contract_data["milestones"][0]["status"] == "pending"

    # 11. Customer funds the milestone
    fund_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/fund",
        headers=cust_headers,
    )
    assert fund_res.status_code == 200
    assert fund_res.json()["data"]["milestones"][0]["status"] == "funded"

    # 12. Professional 1 submits deliverables
    submit_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/submit",
        json={
            "deliverable_notes": "Completed Kubernetes architecture setup, wrote Terraform scripts, and verified Prometheus monitoring metrics.",
        },
        headers=p1_headers,
    )
    assert submit_res.status_code == 200
    assert submit_res.json()["data"]["milestones"][0]["status"] == "submitted"

    # 13. Customer approves deliverable
    approve_res = await client.post(
        f"/api/v1/contracts/{contract_id}/milestones/{milestone_id}/approve",
        json={"confirmed": True},
        headers=cust_headers,
    )
    assert approve_res.status_code == 200
    completed_contract = approve_res.json()["data"]
    assert completed_contract["milestones"][0]["status"] == "approved"
    assert completed_contract["status"] == "completed"

    # 14. Customer submits 5-star review for Professional 1
    rev_res = await client.post(
        "/api/v1/reviews",
        json={
            "contract_id": contract_id,
            "rating": 5,
            "comment": "Outstanding technical expertise! Priya completed the Kubernetes migration flawlessly ahead of schedule.",
        },
        headers=cust_headers,
    )
    assert rev_res.status_code == 201
    assert rev_res.json()["data"]["rating"] == 5

    # 15. Verify Professional 1's profile rating updated
    p1_profile_res = await client.get("/api/v1/professionals/me", headers=p1_headers)
    assert p1_profile_res.status_code == 200
    prof_data = p1_profile_res.json()["data"]
    assert float(prof_data["rating_average"]) == 5.0
    assert prof_data["total_reviews_count"] == 1
