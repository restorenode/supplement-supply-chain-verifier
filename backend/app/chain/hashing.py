from web3 import Web3

from app.attestation.canonical import build_canonical_attestation, canonical_attestation_json
from app.models.batch import Batch
from app.schemas.extraction import ExtractionResult


def build_attestation_json(batch: Batch, extraction: ExtractionResult, document_fingerprint: str) -> str:
    attestation = build_canonical_attestation(batch, extraction, document_fingerprint)
    return canonical_attestation_json(attestation)


def hash_batch_id(batch_id: str) -> bytes:
    return Web3.keccak(text=batch_id)


def hash_attestation(canonical_json: str) -> bytes:
    return Web3.keccak(text=canonical_json)


def compute_attestation_hash(batch: Batch, extraction_fields: dict, document_fingerprint: str) -> tuple[str, bytes]:
    """Return the canonical attestation JSON and its keccak hash for a stored extraction."""
    extraction = ExtractionResult.model_validate(extraction_fields)
    canonical_json = build_attestation_json(batch, extraction, document_fingerprint)
    return canonical_json, hash_attestation(canonical_json)
