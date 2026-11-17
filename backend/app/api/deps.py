from collections.abc import Generator

from fastapi import status
from sqlalchemy.orm import Session

from app.core.errors import raise_api_error
from app.db import session
from app.models.batch import Batch
from app.models.extraction import Extraction


def get_db() -> Generator[Session, None, None]:
    db = session.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_batch_or_404(db: Session, batch_id: str) -> Batch:
    batch = db.get(Batch, batch_id)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batch_id}' not found")
    return batch


def get_extraction_or_404(db: Session, batch_id: str) -> Extraction:
    extraction = db.get(Extraction, batch_id)
    if not extraction:
        raise_api_error(
            status.HTTP_404_NOT_FOUND,
            "EXTRACTION_NOT_FOUND",
            f"No extracted data for batch '{batch_id}'. Run extraction first.",
        )
    return extraction
