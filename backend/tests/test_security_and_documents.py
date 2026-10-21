import io

import pytest
from httpx import AsyncClient

from app.core.rate_limit import limiter


async def get_test_token(client: AsyncClient, email: str, role: str = "customer") -> str:
    """Helper to register and login a test user, returning access token."""
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "first_name": "Test",
            "last_name": "User",
            "role": role,
            "country_code": "IN",
            "preferred_currency": "INR",
        },
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword123!"},
    )
    return login_res.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Verify that OWASP-recommended security headers are present on responses."""
    res = await client.get("/api/v1/health")
    assert res.status_code == 200
    headers = res.headers

    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in headers or "content-security-policy" in headers


@pytest.mark.asyncio
async def test_document_presign_validation(client: AsyncClient):
    """Test presign upload validation (size, extension, allowed types)."""
    # 1. Login user
    token = await get_test_token(client, "presign.tester@example.com", "customer")
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Reject disallowed extension (.exe)
    res_bad_ext = await client.post(
        "/api/v1/documents/presign-upload",
        headers=auth_headers,
        json={
            "filename": "malware.exe",
            "content_type": "application/x-msdownload",
            "file_size_bytes": 1024,
            "classification": "credential",
        },
    )
    assert res_bad_ext.status_code == 400
    assert "Unsupported file extension" in res_bad_ext.json()["error"]["message"]

    # 3. Reject oversized file (> 15 MB)
    res_oversize = await client.post(
        "/api/v1/documents/presign-upload",
        headers=auth_headers,
        json={
            "filename": "huge_file.pdf",
            "content_type": "application/pdf",
            "file_size_bytes": 16 * 1024 * 1024,  # 16 MB
            "classification": "credential",
        },
    )
    assert res_oversize.status_code in (400, 422)

    # 4. Valid PDF presign request
    res_valid = await client.post(
        "/api/v1/documents/presign-upload",
        headers=auth_headers,
        json={
            "filename": "legal_bar_license.pdf",
            "content_type": "application/pdf",
            "file_size_bytes": 204800,
            "classification": "credential",
        },
    )
    assert res_valid.status_code == 200
    data = res_valid.json()["data"]
    assert "document_id" in data
    assert "upload_url" in data
    assert data["storage_key"].endswith(".pdf")


@pytest.mark.asyncio
async def test_direct_upload_magic_byte_verification(client: AsyncClient):
    """Test direct multipart upload and strict binary magic byte verification."""
    bob_token = await get_test_token(client, "magic.bob@example.com", "professional")
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # Case A: Spoofed file (plain text named .pdf without %PDF- magic bytes)
    fake_pdf_content = b"This is just normal text, pretending to be a PDF."
    fake_file = io.BytesIO(fake_pdf_content)
    spoof_res = await client.post(
        "/api/v1/documents/upload",
        headers=bob_headers,
        files={"file": ("fake_degree.pdf", fake_file, "application/pdf")},
        data={"classification": "credential"},
    )
    assert spoof_res.status_code == 403
    assert "MIME spoofing detected" in spoof_res.json()["error"]["message"]

    # Case B: Genuine PDF with authentic %PDF- header
    real_pdf_content = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    real_file = io.BytesIO(real_pdf_content)
    upload_res = await client.post(
        "/api/v1/documents/upload",
        headers=bob_headers,
        files={"file": ("bar_license.pdf", real_file, "application/pdf")},
        data={"classification": "credential"},
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()["data"]
    assert doc_data["scan_status"] == "clean"
    doc_id = doc_data["id"]

    # Case C: Download URL generation
    download_res = await client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers=bob_headers,
    )
    assert download_res.status_code == 200
    assert "download_url" in download_res.json()["data"]

    # Case D: Unauthorized user cannot download Bob's document
    charlie_token = await get_test_token(client, "other.charlie@example.com", "customer")
    charlie_headers = {"Authorization": f"Bearer {charlie_token}"}

    forbidden_res = await client.get(
        f"/api/v1/documents/{doc_id}/download",
        headers=charlie_headers,
    )
    assert forbidden_res.status_code == 403


@pytest.mark.asyncio
async def test_rate_limiter_enforcement(client: AsyncClient):
    """Test that when rate limiter is enabled, exceeding threshold triggers HTTP 429."""
    limiter.enabled = True
    try:
        # Rapid fire 12 login requests to trigger the 10/minute limit
        responses = []
        for _ in range(12):
            res = await client.post(
                "/api/v1/auth/login",
                json={"email": "nonexistent@example.com", "password": "WrongPassword!"},
            )
            responses.append(res.status_code)

        # At least one request should have hit 429
        assert 429 in responses
    finally:
        # Re-disable to keep other tests fast and isolated
        limiter.enabled = False
