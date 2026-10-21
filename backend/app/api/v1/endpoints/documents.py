import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import ResourceNotFoundException, SecurityViolationException
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.base import ResponseModel
from app.schemas.document import (
    DocumentCompleteUploadRequest,
    DocumentDownloadResponse,
    DocumentPresignRequest,
    DocumentPresignResponse,
    DocumentResponse,
)
from app.services.document_service import DocumentService

router = APIRouter()


@router.post("/presign-upload", response_model=ResponseModel[DocumentPresignResponse])
async def presign_upload(
    req: DocumentPresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate presigned upload details with size and MIME validation."""
    detected_mime = DocumentService.validate_file_metadata(
        filename=req.filename,
        content_type=req.content_type,
        file_size_bytes=req.file_size_bytes,
    )

    storage_key = DocumentService.generate_storage_key(
        user_id=current_user.id,
        classification=req.classification,
        filename=req.filename,
    )

    doc = Document(
        owner_id=current_user.id,
        storage_key=storage_key,
        original_filename=req.filename,
        detected_content_type=detected_mime,
        file_size_bytes=req.file_size_bytes,
        classification=req.classification,
        scan_status="pending",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    upload_url = f"/api/v1/documents/{doc.id}/upload-binary"

    return ResponseModel(
        data=DocumentPresignResponse(
            document_id=doc.id,
            storage_key=storage_key,
            upload_url=upload_url,
            expires_in_seconds=900,  # 15 minutes TTL
        )
    )


@router.post("/upload", response_model=ResponseModel[DocumentResponse])
async def upload_document_direct(
    file: UploadFile = File(...),
    classification: Annotated[str, Form()] = "credential",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Direct multipart upload with immediate zero-trust magic byte verification."""
    data = await file.read()
    file_size = len(data)

    detected_mime = DocumentService.validate_file_metadata(
        filename=file.filename or "unknown",
        content_type=file.content_type or "application/octet-stream",
        file_size_bytes=file_size,
    )

    # Inspect initial binary magic bytes
    DocumentService.verify_magic_bytes(data=data, expected_content_type=detected_mime)

    storage_key = DocumentService.generate_storage_key(
        user_id=current_user.id,
        classification=classification,
        filename=file.filename or "file",
    )

    # Persist file
    DocumentService.save_local_file(storage_key=storage_key, data=data)

    doc = Document(
        owner_id=current_user.id,
        storage_key=storage_key,
        original_filename=file.filename or "file",
        detected_content_type=detected_mime,
        file_size_bytes=file_size,
        classification=classification,
        scan_status="clean",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return ResponseModel(data=DocumentResponse.model_validate(doc))


@router.post("/{id}/complete-upload", response_model=ResponseModel[DocumentResponse])
async def complete_upload(
    id: uuid.UUID,
    req: DocumentCompleteUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm upload completion and verify magic bytes header."""
    doc = await db.get(Document, id)
    if not doc:
        raise ResourceNotFoundException("Document not found")

    if doc.owner_id != current_user.id:
        raise SecurityViolationException("Access forbidden to document")

    if req.magic_header_hex:
        try:
            header_bytes = bytes.fromhex(req.magic_header_hex)
            DocumentService.verify_magic_bytes(
                data=header_bytes, expected_content_type=doc.detected_content_type
            )
            doc.scan_status = "clean"
        except Exception as e:
            doc.scan_status = "flagged"
            await db.commit()
            raise SecurityViolationException(f"Magic bytes verification failed: {e}")
    else:
        doc.scan_status = "clean"

    await db.commit()
    await db.refresh(doc)
    return ResponseModel(data=DocumentResponse.model_validate(doc))


@router.get("/{id}", response_model=ResponseModel[DocumentResponse])
async def get_document(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve document metadata with ownership authorization."""
    doc = await db.get(Document, id)
    if not doc:
        raise ResourceNotFoundException("Document not found")

    is_admin = any(r.role == "administrator" for r in current_user.roles)
    if doc.owner_id != current_user.id and not is_admin:
        raise SecurityViolationException("Access forbidden to document metadata")

    return ResponseModel(data=DocumentResponse.model_validate(doc))


@router.get("/{id}/download", response_model=ResponseModel[DocumentDownloadResponse])
async def get_download_url(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate time-limited secure download URL."""
    doc = await db.get(Document, id)
    if not doc:
        raise ResourceNotFoundException("Document not found")

    is_admin = any(r.role == "administrator" for r in current_user.roles)
    if doc.owner_id != current_user.id and not is_admin:
        raise SecurityViolationException("Access forbidden to document")

    download_url = DocumentService.get_download_url(
        storage_key=doc.storage_key, document_id=doc.id
    )

    return ResponseModel(
        data=DocumentDownloadResponse(
            document_id=doc.id,
            original_filename=doc.original_filename,
            download_url=download_url,
            expires_in_seconds=300,  # 5 minutes TTL
        )
    )


@router.get("/{id}/download-file")
async def download_file_stream(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Direct stream for authorized users."""
    doc = await db.get(Document, id)
    if not doc:
        raise ResourceNotFoundException("Document not found")

    is_admin = any(r.role == "administrator" for r in current_user.roles)
    if doc.owner_id != current_user.id and not is_admin:
        raise SecurityViolationException("Access forbidden to document")

    data = DocumentService.read_local_file(doc.storage_key)
    if not data:
        raise ResourceNotFoundException("Physical file not found on storage")

    return Response(
        content=data,
        media_type=doc.detected_content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{doc.original_filename}"',
            "X-Content-Type-Options": "nosniff",
        },
    )
