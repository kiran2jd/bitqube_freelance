import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DocumentPresignRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(..., max_length=100)
    file_size_bytes: int = Field(..., gt=0, le=15 * 1024 * 1024)  # Max 15 MB
    classification: Literal["credential", "deliverable", "dispute_evidence", "invoice"] = "credential"


class DocumentPresignResponse(BaseModel):
    document_id: uuid.UUID
    storage_key: str
    upload_url: str
    expires_in_seconds: int
    fields: dict[str, str] = {}


class DocumentCompleteUploadRequest(BaseModel):
    magic_header_hex: str | None = None  # Optional hex-encoded first 16 bytes for client verification


class DocumentDownloadResponse(BaseModel):
    document_id: uuid.UUID
    original_filename: str
    download_url: str
    expires_in_seconds: int


class DocumentResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    storage_key: str
    original_filename: str
    detected_content_type: str
    file_size_bytes: int
    classification: str
    scan_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
