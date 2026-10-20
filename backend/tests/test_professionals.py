import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_professional_and_profile_flow(client: AsyncClient):
    payload = {
        "email": "pro.bob@example.com",
        "password": "SecurePassword123!",
        "first_name": "Bob",
        "last_name": "Verma",
        "role": "professional",
        "country_code": "IN",
        "preferred_currency": "INR",
    }
    reg_res = await client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    token = reg_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve own professional profile
    me_res = await client.get("/api/v1/professionals/me", headers=headers)
    assert me_res.status_code == 200
    profile = me_res.json()["data"]
    assert profile["display_name"] == "Bob Verma"
    assert profile["verification_status"] == "unverified"

    # Update professional profile
    update_res = await client.put(
        "/api/v1/professionals/me",
        json={
            "title": "Senior AI & Cloud Architect",
            "biography": "Specialized in enterprise LLM deployment and cloud automation.",
            "hourly_rate": 5000.0,
            "skills": ["Python", "FastAPI", "AI", "Cloud"],
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()["data"]
    assert updated["title"] == "Senior AI & Cloud Architect"
    assert "Python" in updated["skills"]

    # Submit Credential for Verification
    cred_res = await client.post(
        "/api/v1/professionals/me/credentials",
        json={
            "title": "Certified Cloud Solutions Architect",
            "issuing_organization": "Cloud Native Foundation",
            "credential_identifier": "CNCF-88912-IN",
        },
        headers=headers,
    )
    assert cred_res.status_code == 200
    cred = cred_res.json()["data"]
    assert cred["verification_status"] == "pending"

    # Profile verification_status transitions to 'pending'
    me_after = await client.get("/api/v1/professionals/me", headers=headers)
    assert me_after.json()["data"]["verification_status"] == "pending"


@pytest.mark.asyncio
async def test_regulated_service_restriction_for_unverified(client: AsyncClient):
    # Pro Bob logs in
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "pro.bob@example.com", "password": "SecurePassword123!"},
    )
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch categories
    cats_res = await client.get("/api/v1/categories")
    categories = cats_res.json()["data"]
    legal_cat = next(c for c in categories if c["slug"] == "legal-services")
    tech_cat = next(c for c in categories if c["slug"] == "web-mobile-development")

    # Attempt to post a service in regulated 'Legal Services' category while unverified -> Should be 403 Forbidden
    legal_service_payload = {
        "category_id": legal_cat["id"],
        "title": "Corporate Legal Advisory",
        "description": "Full corporate governance and IP compliance advisory for startups.",
        "price_type": "fixed",
        "base_price": 25000.0,
        "currency_code": "INR",
        "delivery_days": 10,
    }
    forbidden_res = await client.post("/api/v1/services", json=legal_service_payload, headers=headers)
    assert forbidden_res.status_code == 403
    assert "regulated" in forbidden_res.json()["error"]["message"].lower()

    # Attempt to post in unregulated 'Web & Mobile Development' category -> Should succeed (201 Created)
    tech_service_payload = {
        "category_id": tech_cat["id"],
        "title": "Full-Stack Web Application Development",
        "description": "Custom modern web application developed with React, TypeScript, and FastAPI.",
        "price_type": "fixed",
        "base_price": 50000.0,
        "currency_code": "INR",
        "delivery_days": 14,
    }
    tech_res = await client.post("/api/v1/services", json=tech_service_payload, headers=headers)
    assert tech_res.status_code == 201
    service_data = tech_res.json()["data"]
    assert service_data["title"] == "Full-Stack Web Application Development"
    assert service_data["status"] == "active"
