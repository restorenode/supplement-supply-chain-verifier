from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import Batch as BatchModel, BatchStatus
from app.schemas.batch import Batch, BatchCreate

router = APIRouter()


@router.post(
    "/batches",
    response_model=Batch,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_api_key)],
)
def create_batch(payload: BatchCreate, db: Session = Depends(get_db)) -> BatchModel:
    existing = db.get(BatchModel, payload.batch_id)
    if existing:
        raise_api_error(
            status.HTTP_409_CONFLICT,
            "BATCH_EXISTS",
            f"Batch with ID '{payload.batch_id}' already exists",
        )

    batch = BatchModel(
        batch_id=payload.batch_id,
        product_name=payload.product_name,
        supplement_type=payload.supplement_type,
        manufacturer=payload.manufacturer,
        production_date=payload.production_date,
        expires_date=payload.expires_date,
        status=BatchStatus.DRAFT,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/batches/{batchId}", response_model=Batch, dependencies=[Depends(require_api_key)])
def get_batch(batchId: str, db: Session = Depends(get_db)) -> BatchModel:
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")
    return batch
