import logging
from datetime import timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from web3 import Web3

from app.api.deps import get_batch_or_404, get_db
from app.chain.deps import get_chain_client
from app.chain.hashing import compute_attestation_hash, hash_batch_id
from app.core.errors import raise_api_error
from app.models.extraction import Extraction
from app.schemas.extraction import ExtractionResult
from app.schemas.verify import VerificationResult, VerificationStatus

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/batches/{batchId}/verify", response_model=VerificationResult)
def verify_batch(
    batchId: str,
    db: Session = Depends(get_db),
    chain_client=Depends(get_chain_client),
) -> dict:
    batch = get_batch_or_404(db, batchId)
    product = {
        "productName": batch.product_name,
        "manufacturer": batch.manufacturer,
        "supplementType": batch.supplement_type,
        "productionDate": batch.production_date,
        "expiresDate": batch.expires_date,
    }
    published_at = batch.published_at.replace(tzinfo=timezone.utc) if batch.published_at else None
    base = {
        "batchId": batch.batch_id,
        "txHash": batch.tx_hash,
        "chain": batch.chain,
        "publishedAt": published_at,
        "product": product,
    }

    extraction = db.get(Extraction, batchId)
    if extraction is None:
        # Registered but the lab report hasn't been processed: nothing to hash or compare yet.
        return {
            **base,
            "verified": False,
            "status": VerificationStatus.UNPUBLISHED,
            "mismatchReason": "Lab results have not been extracted yet.",
        }

    _canonical_json, offchain_hash = compute_attestation_hash(
        batch, extraction.extracted_fields, extraction.document_fingerprint
    )

    try:
        onchain_hash = chain_client.get(hash_batch_id(batch.batch_id))
    except Exception:
        logger.exception("Reading on-chain attestation for batch %s failed", batchId)
        raise_api_error(
            status.HTTP_502_BAD_GATEWAY,
            "BLOCKCHAIN_ERROR",
            "Could not read the on-chain registry. Try again later.",
        )

    verified = onchain_hash is not None and offchain_hash == onchain_hash
    if onchain_hash is None:
        result_status = VerificationStatus.UNPUBLISHED
        mismatch_reason = "No sealed record exists for this batch."
    elif verified:
        result_status = VerificationStatus.VERIFIED
        mismatch_reason = None
    else:
        result_status = VerificationStatus.MISMATCH
        mismatch_reason = "The computed fingerprint does not match the sealed record."

    fields = ExtractionResult.model_validate(extraction.extracted_fields)
    lab_report = {
        "labName": fields.lab_name,
        "reportDate": fields.report_date,
        "analytes": fields.analytes,
        "contaminants": fields.contaminants,
        "methods": fields.methods,
    }

    return {
        **base,
        "verified": verified,
        "status": result_status,
        "offchainHash": Web3.to_hex(offchain_hash),
        "onchainHash": Web3.to_hex(onchain_hash) if onchain_hash else None,
        "mismatchReason": mismatch_reason,
        "labReport": lab_report,
    }
