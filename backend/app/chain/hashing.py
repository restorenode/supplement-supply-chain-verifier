import json
from typing import Any, Dict

from web3 import Web3

from app.models.batch import Batch


def _batch_to_canonical_dict(batch: Batch) -> Dict[str, Any]:
    data: Dict[str, Any] = {
        "batchId": batch.batch_id,
        "productName": batch.product_name,
        "supplementType": batch.supplement_type,
        "manufacturer": batch.manufacturer,
        "productionDate": batch.production_date.isoformat(),
    }
    if batch.expires_date is not None:
        data["expiresDate"] = batch.expires_date.isoformat()
    else:
        data["expiresDate"] = None
    return data


def canonical_attestation_json(batch: Batch) -> str:
    payload = _batch_to_canonical_dict(batch)
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def hash_batch_id(batch_id: str) -> bytes:
    return Web3.keccak(text=batch_id)


def hash_attestation(canonical_json: str) -> bytes:
    return Web3.keccak(text=canonical_json)
