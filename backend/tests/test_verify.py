from datetime import date

from app.chain.deps import get_chain_client
from app.chain.hashing import canonical_attestation_json, hash_attestation
from app.db import session
from app.models.batch import Batch, BatchStatus


class StubChainClient:
    def __init__(self, onchain_hash: bytes | None):
        self._onchain_hash = onchain_hash

    def get(self, batch_id_hash: bytes):
        return self._onchain_hash


def _create_ready_batch(batch_id: str) -> Batch:
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
    db.close()
    return batch


def test_verify_true_when_hashes_match(client):
    batch = _create_ready_batch("VA-2025-READY-1")
    canonical_json = canonical_attestation_json(batch)
    offchain_hash = hash_attestation(canonical_json)

    client.app.dependency_overrides[get_chain_client] = lambda: StubChainClient(offchain_hash)

    response = client.get(f"/batches/{batch.batch_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is True
    assert data["onchainHash"] == data["offchainHash"]


def test_verify_false_when_hashes_mismatch(client):
    batch = _create_ready_batch("VA-2025-READY-2")
    mismatched = hash_attestation("mismatch")

    client.app.dependency_overrides[get_chain_client] = lambda: StubChainClient(mismatched)

    response = client.get(f"/batches/{batch.batch_id}/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is False
    assert data["mismatchReason"]
