import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_public_config(client: AsyncClient):
    response = await client.get("/api/v1/config/public")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    cfg = data["data"]
    assert cfg["default_country"] == "IN"
    assert cfg["default_currency"] == "INR"
    assert cfg["payment_provider"] == "razorpay"
    assert cfg["platform_fee_percentage"] == 10.0

    # Strict check on placeholders: BTQ and QUBEX MUST BE FALSE
    assert cfg["feature_flags"]["btq_payments_enabled"] is False
    assert cfg["feature_flags"]["qubex_benefits_enabled"] is False

    # Check countries
    country_codes = [c["country_code"] for c in cfg["countries"]]
    assert "IN" in country_codes
    assert "US" in country_codes
    assert "GB" in country_codes
    assert "DE" in country_codes

    # Check currencies
    currency_codes = [c["code"] for c in cfg["currencies"]]
    assert "INR" in currency_codes
    assert "USD" in currency_codes
    assert "GBP" in currency_codes
    assert "EUR" in currency_codes
