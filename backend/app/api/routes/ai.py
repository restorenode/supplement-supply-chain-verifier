from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.ai.service import run_extraction, to_response
from app.api.deps import get_batch_or_404, get_db
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import BatchStatus
from app.schemas.extraction import ExtractionResponse

router = APIRouter()


@router.post(
    "/batches/{batchId}/extract",
    response_model=ExtractionResponse,
    dependencies=[Depends(require_api_key)],
)
def extract_data(batchId: str, db: Session = Depends(get_db)) -> ExtractionResponse:
    batch = get_batch_or_404(db, batchId)
    if batch.status == BatchStatus.PUBLISHED:
        # Re-extracting would change the off-chain data and break verification of the published hash.
        raise_api_error(
            status.HTTP_409_CONFLICT,
            "ALREADY_PUBLISHED",
            "Batch is already published; its extracted data can no longer change",
        )

    extraction, model_info, extracted_at, _document = run_extraction(db, batch)
    return to_response(batch, extraction, model_info, extracted_at)
