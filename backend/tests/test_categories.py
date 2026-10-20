import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_all_15_categories(client: AsyncClient):
    response = await client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    categories = data["data"]
    assert len(categories) == 15

    # Check for core categories specified in requirements
    slugs = [c["slug"] for c in categories]
    assert "legal-services" in slugs
    assert "business-advisory" in slugs
    assert "financial-advisory" in slugs
    assert "web3-blockchain-developers" in slugs
    assert "it-consultancy" in slugs
    assert "web-mobile-development" in slugs
    assert "digital-marketing" in slugs
    assert "ai-automation" in slugs
    assert "design-creative-services" in slugs
    assert "accounting-taxation" in slugs
    assert "hr-recruitment" in slugs
    assert "real-estate-business-projects" in slugs
    assert "education-training" in slugs
    assert "translation-documentation" in slugs
    assert "other-professional-services" in slugs

    # Verify sorting
    sort_orders = [c["sort_order"] for c in categories]
    assert sort_orders == sorted(sort_orders)


@pytest.mark.asyncio
async def test_get_single_category_by_slug(client: AsyncClient):
    response = await client.get("/api/v1/categories/ai-automation")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["slug"] == "ai-automation"
    assert data["data"]["name"] == "AI & Automation"
    assert data["data"]["icon_name"] == "Bot"


@pytest.mark.asyncio
async def test_get_nonexistent_category_returns_404(client: AsyncClient):
    response = await client.get("/api/v1/categories/non-existent-category-slug")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"
