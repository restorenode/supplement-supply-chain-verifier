from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.chain.deps import get_chain_client
from app.chain.hashing import canonical_attestation_json, hash_attestation, hash_batch_id
from app.core.config import settings
from app.core.errors import error_response, raise_api_error
from app.core.security import require_api_key
from app.models.batch import Batch as BatchModel, BatchStatus

router = APIRouter()


@router.get("/batches/{batchId}/attestation", dependencies=[Depends(require_api_key)])
def get_attestation(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Attestation not implemented"),
    )


@router.post("/batches/{batchId}/publish", dependencies=[Depends(require_api_key)])
def publish_attestation(
    batchId: str,
    db: Session = Depends(get_db),
    chain_client=Depends(get_chain_client),
) -> JSONResponse:
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")
    if batch.status != BatchStatus.READY:
        raise_api_error(
            status.HTTP_400_BAD_REQUEST,
            "ATTESTATION_NOT_READY",
            "Attestation data not available. Extract data first.",
        )

    batch_id_hash = hash_batch_id(batch.batch_id)
    canonical_json = canonical_attestation_json(batch)
    attestation_hash = hash_attestation(canonical_json)

    tx_hash = chain_client.publish(batch_id_hash, attestation_hash)
    receipt = chain_client.get_receipt(tx_hash)

    batch.status = BatchStatus.PUBLISHED
    batch.tx_hash = tx_hash
    batch.chain = settings.chain_name
    batch.publisher_address = chain_client.publisher_address
    batch.published_at = datetime.now(timezone.utc)
    db.commit()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "batchId": batch.batch_id,
            "txHash": receipt.tx_hash,
            "blockNumber": receipt.block_number,
            "publishedAt": batch.published_at.isoformat(),
        },
    )
