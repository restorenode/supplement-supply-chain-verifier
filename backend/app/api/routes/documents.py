from datetime import datetime, timezone
from hashlib import sha256
from pathlib import PurePath
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_batch_or_404, get_db
from app.core.config import settings
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import BatchStatus
from app.models.document import Document as DocumentModel
from app.schemas.document import Document

router = APIRouter()

_PDF_MAGIC = b"%PDF-"
_CHUNK_SIZE = 1024 * 1024


def _read_limited(file: UploadFile, limit: int) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while chunk := file.file.read(_CHUNK_SIZE):
        total += len(chunk)
        if total > limit:
            raise_api_error(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                "FILE_TOO_LARGE",
                f"File exceeds the {limit // (1024 * 1024)} MB upload limit",
            )
        chunks.append(chunk)
    return b"".join(chunks)


@router.post(
    "/batches/{batchId}/documents",
    response_model=Document,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_api_key)],
)
def upload_document(
    batchId: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentModel:
    batch = get_batch_or_404(db, batchId)
    if batch.status == BatchStatus.PUBLISHED:
        raise_api_error(
            status.HTTP_409_CONFLICT,
            "ALREADY_PUBLISHED",
            "Batch is already published; its documents can no longer change",
        )

    content = _read_limited(file, settings.max_upload_bytes)
    if not content.startswith(_PDF_MAGIC):
        raise_api_error(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "UNSUPPORTED_FILE_TYPE",
            "Only PDF lab reports are accepted",
        )

    fingerprint = "0x" + sha256(content).hexdigest()
    # Keep only the base name of the client-supplied filename and cap its length.
    filename = PurePath((file.filename or "").replace("\\", "/")).name[:255] or "document.pdf"
    document = DocumentModel(
        document_id=str(uuid4()),
        batch_id=batch.batch_id,
        filename=filename,
        content_type="application/pdf",
        uploaded_at=datetime.now(timezone.utc),
        data=content,
        fingerprint=fingerprint,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
