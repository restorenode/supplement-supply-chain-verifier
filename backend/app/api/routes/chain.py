import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_batch_or_404, get_db, get_extraction_or_404
from app.chain.deps import get_chain_client
from app.chain.hashing import compute_attestation_hash, hash_batch_id
from app.chain.networks import resolve_network
from app.core.config import settings
from app.core.errors import raise_api_error
from app.core.security import require_api_key
from app.models.batch import BatchStatus

logger = logging.getLogger(__name__)

router = APIRouter()


def _iso_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


@router.get("/chain/info")
def chain_info() -> dict:
    """Public registry details for display: network, chain ID, explorer, contract. No secrets."""
    network = resolve_network()
    mock = settings.chain_mode.lower() == "mock"
    address = settings.contract_address.strip().lower() or None
    return {
        "network": network.key,
        "displayName": network.display_name,
        "chainId": network.chain_id or None,
        "testnet": network.testnet,
        "mode": "mock" if mock else "real",
        # Mock transactions and the configured contract don't exist on the real explorer.
        "contractAddress": None if mock else address,
        "explorerUrl": None if mock else network.explorer_url,
    }


@router.get("/batches/{batchId}/attestation", dependencies=[Depends(require_api_key)])
def get_attestation(batchId: str, db: Session = Depends(get_db)) -> JSONResponse:
    batch = get_batch_or_404(db, batchId)
    extraction = get_extraction_or_404(db, batchId)
    canonical_json, canonical_hash = compute_attestation_hash(
        batch, extraction.extracted_fields, extraction.document_fingerprint
    )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "batchId": batch.batch_id,
            "canonicalJson": json.loads(canonical_json),
            "canonicalJsonHash": f"0x{canonical_hash.hex()}",
            "createdAt": _iso_utc(extraction.extracted_at),
            "published": batch.status == BatchStatus.PUBLISHED,
            "chain": batch.chain or resolve_network().key,
            "txHash": batch.tx_hash,
            "publisherAddress": batch.publisher_address,
            "publishedAt": _iso_utc(batch.published_at),
        },
    )


@router.post("/batches/{batchId}/publish", dependencies=[Depends(require_api_key)])
def publish_attestation(
    batchId: str,
    db: Session = Depends(get_db),
    chain_client=Depends(get_chain_client),
) -> JSONResponse:
    batch = get_batch_or_404(db, batchId)
    if batch.status == BatchStatus.PUBLISHED:
        raise_api_error(status.HTTP_409_CONFLICT, "ALREADY_PUBLISHED", f"Batch '{batchId}' is already published")
    if batch.status != BatchStatus.READY:
        raise_api_error(
            status.HTTP_400_BAD_REQUEST,
            "ATTESTATION_NOT_READY",
            "Attestation data not available. Extract data first.",
        )

    extraction = get_extraction_or_404(db, batchId)
    _canonical_json, attestation_hash = compute_attestation_hash(
        batch, extraction.extracted_fields, extraction.document_fingerprint
    )

    try:
        tx_hash = chain_client.publish(hash_batch_id(batch.batch_id), attestation_hash)
        receipt = chain_client.get_receipt(tx_hash)
    except Exception as exc:
        logger.exception("Publishing batch %s to chain failed", batchId)
        if "ALREADY_PUBLISHED" in str(exc):
            raise_api_error(
                status.HTTP_409_CONFLICT,
                "ALREADY_PUBLISHED",
                "An attestation for this batch already exists on-chain",
            )
        raise_api_error(
            status.HTTP_502_BAD_GATEWAY,
            "BLOCKCHAIN_ERROR",
            "Failed to publish attestation to blockchain",
        )

    if receipt.status != 1:
        raise_api_error(
            status.HTTP_502_BAD_GATEWAY,
            "BLOCKCHAIN_ERROR",
            "Publish transaction reverted on-chain",
            {"txHash": receipt.tx_hash},
        )

    published_at = datetime.now(timezone.utc)
    batch.status = BatchStatus.PUBLISHED
    batch.tx_hash = receipt.tx_hash
    batch.chain = resolve_network().key
    batch.publisher_address = chain_client.publisher_address
    batch.published_at = published_at
    db.commit()

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "batchId": batch.batch_id,
            "txHash": receipt.tx_hash,
            "blockNumber": receipt.block_number,
            "publishedAt": published_at.isoformat(),
        },
    )
