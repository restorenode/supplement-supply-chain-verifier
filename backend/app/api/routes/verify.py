import logging

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from web3 import Web3

from app.api.deps import get_batch_or_404, get_db, get_extraction_or_404
from app.chain.deps import get_chain_client
from app.chain.hashing import compute_attestation_hash, hash_batch_id
from app.core.errors import raise_api_error
from app.schemas.verify import VerificationResult

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/batches/{batchId}/verify", response_model=VerificationResult)
def verify_batch(
    batchId: str,
    db: Session = Depends(get_db),
    chain_client=Depends(get_chain_client),
) -> dict:
    batch = get_batch_or_404(db, batchId)
    extraction = get_extraction_or_404(db, batchId)
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
    mismatch_reason = None
    if onchain_hash is None:
        mismatch_reason = "No on-chain attestation found for this batch"
    elif not verified:
        mismatch_reason = "Hash mismatch: off-chain and on-chain hashes do not match"

    return {
        "verified": verified,
        "batchId": batch.batch_id,
        "offchainHash": Web3.to_hex(offchain_hash),
        "onchainHash": Web3.to_hex(onchain_hash) if onchain_hash else None,
        "txHash": batch.tx_hash,
        "mismatchReason": mismatch_reason,
    }
