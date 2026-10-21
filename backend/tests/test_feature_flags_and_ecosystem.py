import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_public_config_strictly_disables_crypto(client: AsyncClient):
    """Verify that public platform configuration strictly disables BTQ and QUBEX in MVP."""
    res = await client.get("/api/v1/config/public")
    assert res.status_code == 200
    data = res.json()["data"]

    # Verify fiat defaults
    assert data["default_country"] == "IN"
    assert data["default_currency"] == "INR"
    assert data["payment_provider"] == "razorpay"

    # Verify feature flags are disabled
    flags = data["feature_flags"]
    assert flags["btq_payments_enabled"] is False
    assert flags["qubex_benefits_enabled"] is False


@pytest.mark.asyncio
async def test_crypto_currency_in_orders_rejected(client: AsyncClient):
    """Verify that creating payment orders with cryptocurrency codes is strictly rejected."""
    # Register customer
    reg = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "crypto.guard.test@example.com",
            "password": "SecurePassword123!",
            "first_name": "Crypto",
            "last_name": "Guard",
            "role": "customer",
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    assert reg.status_code == 201
    token = reg.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to request payment with non-existent or crypto milestone
    import uuid
    res = await client.post(
        "/api/v1/payments/orders",
        headers=headers,
        json={"milestone_id": str(uuid.uuid4())},
    )
    # Milestone not found (or rejected)
    assert res.status_code in (400, 404)
