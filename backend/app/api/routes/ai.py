from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.ai.service import run_extraction, to_response
from app.api.deps import get_db
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import Batch as BatchModel
from app.schemas.extraction import ExtractionResponse

router = APIRouter()


@router.post(
    "/batches/{batchId}/extract",
    response_model=ExtractionResponse,
    dependencies=[Depends(require_api_key)],
)
def extract_data(batchId: str, db: Session = Depends(get_db)) -> ExtractionResponse:
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")

    extraction, model_info, extracted_at, _document = run_extraction(db, batch)
    return to_response(batch, extraction, model_info, extracted_at)
