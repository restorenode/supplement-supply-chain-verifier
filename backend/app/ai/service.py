from __future__ import annotations

from datetime import datetime, timezone
from typing import Tuple

from sqlalchemy.orm import Session

from app.ai.llm import extract_lab_report, get_model_info
from app.ai.pdf_text import extract_text_from_pdf
from app.core.errors import raise_api_error
from app.models.batch import Batch, BatchStatus
from app.models.document import Document
from app.models.extraction import Extraction
from app.schemas.extraction import ExtractionResponse, ExtractionResult


def run_extraction(db: Session, batch: Batch) -> Tuple[ExtractionResult, dict, datetime, Document]:
    document = (
        db.query(Document)
        .filter(Document.batch_id == batch.batch_id)
        .order_by(Document.uploaded_at.desc())
        .first()
    )
    if not document:
        raise_api_error(400, "NO_DOCUMENT", f"No document found for batch '{batch.batch_id}'")

    text = extract_text_from_pdf(document.data)
    extraction = extract_lab_report(text)
    model_info = get_model_info().model_dump(by_alias=True)
    extracted_at = datetime.now(timezone.utc)

    existing = db.get(Extraction, batch.batch_id)
    payload = extraction.model_dump(by_alias=True)
    if existing:
        existing.extracted_fields = payload
        existing.model_info = model_info
        existing.extracted_at = extracted_at
        existing.document_fingerprint = document.fingerprint
    else:
        db.add(
            Extraction(
                batch_id=batch.batch_id,
                extracted_fields=payload,
                model_info=model_info,
                extracted_at=extracted_at,
                document_fingerprint=document.fingerprint,
            )
        )

    batch.status = BatchStatus.READY
    db.commit()
    db.refresh(batch)

    return extraction, model_info, extracted_at, document


def to_response(batch: Batch, extraction: ExtractionResult, model_info: dict, extracted_at: datetime) -> ExtractionResponse:
    return ExtractionResponse(
        batch_id=batch.batch_id,
        extracted_fields=extraction,
        extracted_at=extracted_at,
        model_info=model_info,
    )
