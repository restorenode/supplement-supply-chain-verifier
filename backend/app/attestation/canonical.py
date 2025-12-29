import json
from typing import Any, Dict

from app.models.batch import Batch
from app.schemas.extraction import ExtractionResult


SCHEMA_VERSION = "1.0"


def build_canonical_attestation(
    batch: Batch,
    extraction: ExtractionResult,
    document_fingerprint: str,
) -> Dict[str, Any]:
    return {
        "batchId": batch.batch_id,
        "productName": batch.product_name,
        "supplementType": batch.supplement_type,
        "manufacturer": batch.manufacturer,
        "productionDate": batch.production_date.isoformat(),
        "expiresDate": batch.expires_date.isoformat() if batch.expires_date else None,
        "documentFingerprint": document_fingerprint,
        "extractedFields": extraction.model_dump(by_alias=True),
        "schemaVersion": SCHEMA_VERSION,
    }


def canonical_attestation_json(attestation: Dict[str, Any]) -> str:
    return json.dumps(attestation, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
