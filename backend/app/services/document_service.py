"""Document Service implementing zero-trust file validation,
magic-byte binary inspection, and S3 / local storage management.
"""

import os
import uuid
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import BusinessRuleViolationException, SecurityViolationException

# Strict magic byte signatures
MAGIC_SIGNATURES: dict[str, list[bytes]] = {
    "application/pdf": [b"%PDF-"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [b"PK\x03\x04"],
}

ALLOWED_EXTENSIONS: dict[str, str] = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


class DocumentService:
    @staticmethod
    def validate_file_metadata(
        filename: str, content_type: str, file_size_bytes: int
    ) -> str:
        """Validate filename extension, MIME type, and file size limits."""
        if file_size_bytes > MAX_FILE_SIZE_BYTES:
            raise BusinessRuleViolationException(
                f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB"
            )

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed = ", ".join(ALLOWED_EXTENSIONS.keys())
            raise BusinessRuleViolationException(
                f"Unsupported file extension '{ext}'. Allowed extensions: {allowed}"
            )

        expected_mime = ALLOWED_EXTENSIONS[ext]
        # Allow image/jpeg for both .jpg and .jpeg
        if content_type.lower() != expected_mime.lower():
            # Soft fallback if content-type header is octet-stream
            if content_type.lower() not in ["application/octet-stream", expected_mime.lower()]:
                raise SecurityViolationException(
                    f"Content-Type mismatch: Extension is '{ext}' but declared MIME is '{content_type}'"
                )

        return expected_mime

    @staticmethod
    def verify_magic_bytes(data: bytes, expected_content_type: str) -> bool:
        """Inspect the initial byte header of the binary payload against known magic numbers."""
        if not data or len(data) < 4:
            raise SecurityViolationException("Corrupt or empty file header detected")

        signatures = MAGIC_SIGNATURES.get(expected_content_type)
        if not signatures:
            raise SecurityViolationException(
                f"No magic byte verification rules configured for '{expected_content_type}'"
            )

        matched = any(data.startswith(sig) for sig in signatures)
        if not matched:
            raise SecurityViolationException(
                f"MIME spoofing detected! Binary magic bytes do not match declared type '{expected_content_type}'"
            )
        return True

    @staticmethod
    def generate_storage_key(user_id: uuid.UUID, classification: str, filename: str) -> str:
        """Generate an isolated, unguessable storage key."""
        clean_ext = Path(filename).suffix.lower()
        unique_token = uuid.uuid4().hex
        return f"{classification}s/{user_id}/{unique_token}{clean_ext}"

    @classmethod
    def save_local_file(cls, storage_key: str, data: bytes) -> str:
        """Save file bytes locally for dev/test environments."""
        base_dir = Path("uploads")
        file_path = base_dir / storage_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_bytes(data)
        return str(file_path.resolve())

    @classmethod
    def read_local_file(cls, storage_key: str) -> bytes | None:
        """Read file bytes from local uploads."""
        file_path = Path("uploads") / storage_key
        if file_path.is_file():
            return file_path.read_bytes()
        return None

    @classmethod
    def get_download_url(cls, storage_key: str, document_id: uuid.UUID) -> str:
        """Return download URL (either S3 presigned URL or API download stream)."""
        # If S3 credentials and endpoint are in production mode, generate boto3 presigned URL
        if settings.ENVIRONMENT == "production" and os.getenv("AWS_ACCESS_KEY_ID"):
            try:
                import boto3
                s3 = boto3.client(
                    "s3",
                    endpoint_url=settings.S3_ENDPOINT_URL,
                    aws_access_key_id=settings.S3_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
                    region_name=settings.S3_REGION,
                )
                return s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.S3_BUCKET_NAME, "Key": storage_key},
                    ExpiresIn=300,  # 5 minutes TTL
                )
            except Exception:
                pass
        return f"/api/v1/documents/{document_id}/download-file"
