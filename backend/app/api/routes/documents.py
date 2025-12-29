from datetime import datetime, timezone
from hashlib import sha256
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import Batch as BatchModel
from app.models.document import Document as DocumentModel
from app.schemas.document import Document

router = APIRouter()


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
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")

    content = file.file.read()
    fingerprint = "0x" + sha256(content).hexdigest()
    document = DocumentModel(
        document_id=str(uuid4()),
        batch_id=batch.batch_id,
        filename=file.filename or "document.pdf",
        content_type=file.content_type or "application/pdf",
        uploaded_at=datetime.now(timezone.utc),
        data=content,
        fingerprint=fingerprint,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
