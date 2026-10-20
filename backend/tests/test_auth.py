import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_customer_success(client: AsyncClient):
    payload = {
        "email": "customer.alice@example.com",
        "password": "SecurePassword123!",
        "first_name": "Alice",
        "last_name": "Sharma",
        "role": "customer",
        "country_code": "IN",
        "preferred_currency": "INR",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == "customer.alice@example.com"
    assert "customer" in data["data"]["user"]["roles"]


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    payload = {
        "email": "customer.alice@example.com",
        "password": "AnotherPassword123!",
        "first_name": "Duplicate",
        "last_name": "User",
        "role": "customer",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    payload = {
        "email": "customer.alice@example.com",
        "password": "SecurePassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "customer.alice@example.com"


@pytest.mark.asyncio
async def test_login_invalid_password_fails(client: AsyncClient):
    payload = {
        "email": "customer.alice@example.com",
        "password": "WrongPassword999!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient):
    # Login to get token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer.alice@example.com", "password": "SecurePassword123!"},
    )
    token = login_res.json()["data"]["access_token"]

    # Call /users/me with Bearer token
    res = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["email"] == "customer.alice@example.com"
    assert data["first_name"] == "Alice"


@pytest.mark.asyncio
async def test_unauthorized_access_denied(client: AsyncClient):
    res = await client.get("/api/v1/users/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(client: AsyncClient):
    # Request reset
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "customer.alice@example.com"},
    )
    assert forgot_res.status_code == 200
    dev_token = forgot_res.json()["data"]["dev_reset_token"]

    # Reset with new password
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": dev_token, "new_password": "BrandNewPassword456!"},
    )
    assert reset_res.status_code == 200

    # Login with new password
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer.alice@example.com", "password": "BrandNewPassword456!"},
    )
    assert login_res.status_code == 200
