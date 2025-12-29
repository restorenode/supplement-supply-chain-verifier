import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.chain.deps import get_chain_client
from app.chain.hashing import build_attestation_json, hash_attestation, hash_batch_id
from app.core.config import settings
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import Batch as BatchModel, BatchStatus
from app.models.extraction import Extraction as ExtractionModel
from app.schemas.extraction import ExtractionResult

router = APIRouter()


@router.get("/batches/{batchId}/attestation", dependencies=[Depends(require_api_key)])
def get_attestation(batchId: str, db: Session = Depends(get_db)) -> JSONResponse:
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")

    extraction = db.get(ExtractionModel, batchId)
    if not extraction:
        raise_api_error(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Resource not found")

    extraction_result = ExtractionResult.model_validate(extraction.extracted_fields)
    canonical_json = build_attestation_json(batch, extraction_result, extraction.document_fingerprint)
    canonical_hash = hash_attestation(canonical_json)

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "batchId": batch.batch_id,
            "canonicalJson": json.loads(canonical_json),
            "canonicalJsonHash": f"0x{canonical_hash.hex()}",
            "createdAt": extraction.extracted_at.replace(tzinfo=timezone.utc).isoformat(),
            "published": batch.status == BatchStatus.PUBLISHED,
            "chain": batch.chain or settings.chain_name,
            "txHash": batch.tx_hash,
            "publisherAddress": batch.publisher_address,
            "publishedAt": batch.published_at.replace(tzinfo=timezone.utc).isoformat() if batch.published_at else None,
        },
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
    extraction = db.get(ExtractionModel, batchId)
    if not extraction:
        raise_api_error(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Resource not found")

    extraction_result = ExtractionResult.model_validate(extraction.extracted_fields)
    canonical_json = build_attestation_json(batch, extraction_result, extraction.document_fingerprint)
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
