from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from web3 import Web3

from app.api.deps import get_db
from app.chain.deps import get_chain_client
from app.chain.hashing import build_attestation_json, hash_attestation, hash_batch_id
from app.core.errors import raise_api_error
from app.models.batch import Batch as BatchModel
from app.models.extraction import Extraction as ExtractionModel
from app.schemas.extraction import ExtractionResult
from app.schemas.verify import VerificationResult

router = APIRouter()


@router.get("/batches/{batchId}/verify", response_model=VerificationResult)
def verify_batch(
    batchId: str,
    db: Session = Depends(get_db),
    chain_client=Depends(get_chain_client),
) -> dict:
    batch = db.get(BatchModel, batchId)
    if not batch:
        raise_api_error(status.HTTP_404_NOT_FOUND, "BATCH_NOT_FOUND", f"Batch '{batchId}' not found")

    extraction = db.get(ExtractionModel, batchId)
    if not extraction:
        raise_api_error(status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Resource not found")

    extraction_result = ExtractionResult.model_validate(extraction.extracted_fields)
    batch_id_hash = hash_batch_id(batch.batch_id)
    canonical_json = build_attestation_json(batch, extraction_result, extraction.document_fingerprint)
    offchain_hash = hash_attestation(canonical_json)
    onchain_hash = chain_client.get(batch_id_hash)

    offchain_hex = Web3.to_hex(offchain_hash)
    onchain_hex = Web3.to_hex(onchain_hash) if onchain_hash else None

    verified = onchain_hash is not None and offchain_hash == onchain_hash
    mismatch_reason = None
    if onchain_hash is None:
        mismatch_reason = "No on-chain attestation found for this batch"
    elif offchain_hash != onchain_hash:
        mismatch_reason = "Hash mismatch: off-chain and on-chain hashes do not match"

    return {
        "verified": verified,
        "batchId": batch.batch_id,
        "offchainHash": offchain_hex,
        "onchainHash": onchain_hex,
        "txHash": batch.tx_hash,
        "mismatchReason": mismatch_reason,
    }
