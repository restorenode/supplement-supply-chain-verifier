from datetime import date, datetime, timezone

from app.chain.deps import get_chain_client
from app.chain.hashing import build_attestation_json, hash_attestation
from app.db import session
from app.models.batch import Batch, BatchStatus
from app.models.extraction import Extraction
from app.schemas.extraction import ExtractionResult, ModelInfo


class StubChainClient:
    def __init__(self, onchain_hash: bytes | None):
        self._onchain_hash = onchain_hash

    def get(self, batch_id_hash: bytes):
        return self._onchain_hash


def _create_ready_batch(batch_id: str) -> tuple[str, str]:
    db = session.SessionLocal()
    batch = Batch(
        batch_id=batch_id,
        product_name="Vitamin A 10,000 IU",
        supplement_type="Vitamin A",
        manufacturer="PureSupplements Inc.",
        production_date=date(2025, 1, 15),
        expires_date=None,
        status=BatchStatus.READY,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    extraction = ExtractionResult(
        lab_name=None,
        report_date=None,
        product_or_sample_name=None,
        lot_or_batch_in_report=None,
        potency=None,
        analytes=[],
        contaminants=[],
        methods=[],
        notes=None,
        confidence=0.1,
    )
    db.add(
        Extraction(
            batch_id=batch.batch_id,
            extracted_fields=extraction.model_dump(by_alias=True),
            model_info=ModelInfo(model_name="mock", version="0").model_dump(by_alias=True),
            extracted_at=datetime(2025, 1, 16, tzinfo=timezone.utc),
            document_fingerprint="0x" + "00" * 32,
        )
    )
    db.commit()
    canonical_json = build_attestation_json(batch, extraction, "0x" + "00" * 32)
    db.close()
    return batch.batch_id, canonical_json


def test_verify_true_when_hashes_match(client):
    batch_id, canonical_json = _create_ready_batch("VA-2025-READY-1")
    offchain_hash = hash_attestation(canonical_json)

    client.app.dependency_overrides[get_chain_client] = lambda: StubChainClient(offchain_hash)

    response = client.get(f"/batches/{batch_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is True
    assert data["onchainHash"] == data["offchainHash"]


def test_verify_false_when_hashes_mismatch(client):
    batch_id, _canonical_json = _create_ready_batch("VA-2025-READY-2")
    mismatched = hash_attestation("mismatch")

    client.app.dependency_overrides[get_chain_client] = lambda: StubChainClient(mismatched)

    response = client.get(f"/batches/{batch_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is False
    assert data["mismatchReason"]
