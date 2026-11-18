from pathlib import Path

import pytest

from app.chain.client import ChainReceipt, MockBatchHashRegistryClient
from app.chain.deps import get_chain_client
from app.core import config

HEADERS = {"X-API-Key": "test-key"}
PDF_BYTES = (Path(__file__).parent / "fixtures" / "sample_coa.pdf").read_bytes()


def _batch_payload(batch_id: str, **overrides) -> dict:
    payload = {
        "batchId": batch_id,
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
    }
    payload.update(overrides)
    return payload


def _upload(client, batch_id: str, content: bytes = PDF_BYTES, filename: str = "sample_coa.pdf"):
    files = {"file": (filename, content, "application/pdf")}
    return client.post(f"/batches/{batch_id}/documents", files=files, headers=HEADERS)


def _prepare_ready_batch(client, batch_id: str) -> None:
    assert client.post("/batches", json=_batch_payload(batch_id), headers=HEADERS).status_code == 201
    assert _upload(client, batch_id).status_code == 201
    assert client.post(f"/batches/{batch_id}/extract", headers=HEADERS).status_code == 200


@pytest.fixture()
def mock_chain(client):
    chain = MockBatchHashRegistryClient()
    client.app.dependency_overrides[get_chain_client] = lambda: chain
    return chain


@pytest.mark.parametrize("headers", [{}, {"X-API-Key": "wrong-key"}])
def test_admin_endpoints_require_valid_api_key(client, headers):
    response = client.post("/batches", json=_batch_payload("VA-AUTH-1"), headers=headers)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_empty_configured_api_key_rejects_everything(client):
    config.settings.admin_api_key = ""
    response = client.post("/batches", json=_batch_payload("VA-AUTH-2"), headers={"X-API-Key": ""})
    assert response.status_code == 401


@pytest.mark.parametrize(
    "overrides",
    [
        {"batchId": "bad/id"},
        {"batchId": "x" * 65},
        {"productName": "   "},
        {"expiresDate": "2024-01-01"},
    ],
)
def test_create_batch_rejects_invalid_input(client, overrides):
    response = client.post("/batches", json=_batch_payload("VA-VALID-1", **overrides), headers=HEADERS)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REQUEST"


def test_upload_rejects_non_pdf(client):
    client.post("/batches", json=_batch_payload("VA-UPLOAD-1"), headers=HEADERS)
    response = _upload(client, "VA-UPLOAD-1", content=b"<html>not a pdf</html>", filename="evil.pdf")
    assert response.status_code == 415


def test_upload_rejects_oversized_file(client):
    client.post("/batches", json=_batch_payload("VA-UPLOAD-2"), headers=HEADERS)
    config.settings.max_upload_bytes = 10
    try:
        response = _upload(client, "VA-UPLOAD-2")
    finally:
        config.settings.max_upload_bytes = 20 * 1024 * 1024
    assert response.status_code == 413


def test_upload_strips_path_from_filename(client):
    client.post("/batches", json=_batch_payload("VA-UPLOAD-3"), headers=HEADERS)
    response = _upload(client, "VA-UPLOAD-3", filename="../../etc/report.pdf")
    assert response.status_code == 201
    assert response.json()["filename"] == "report.pdf"


def test_full_publish_and_verify_flow(client, mock_chain):
    batch_id = "VA-FLOW-1"
    _prepare_ready_batch(client, batch_id)

    not_yet = client.get(f"/batches/{batch_id}/verify").json()
    assert not_yet["verified"] is False
    assert not_yet["status"] == "unpublished"
    assert not_yet["onchainHash"] is None

    publish = client.post(f"/batches/{batch_id}/publish", headers=HEADERS)
    assert publish.status_code == 200
    assert publish.json()["txHash"].startswith("0x")

    verify = client.get(f"/batches/{batch_id}/verify").json()
    assert verify["verified"] is True
    assert verify["status"] == "verified"
    assert verify["txHash"] == publish.json()["txHash"]
    assert verify["publishedAt"].endswith(("Z", "+00:00"))
    assert verify["product"] == {
        "productName": "Vitamin A 10,000 IU",
        "manufacturer": "PureSupplements Inc.",
        "supplementType": "Vitamin A",
        "productionDate": "2025-01-15",
        "expiresDate": None,
    }
    assert verify["labReport"]["analytes"] == []

    attestation = client.get(f"/batches/{batch_id}/attestation", headers=HEADERS).json()
    assert attestation["published"] is True
    assert attestation["publishedAt"].endswith("+00:00")


def test_published_batch_is_immutable(client, mock_chain):
    batch_id = "VA-FLOW-2"
    _prepare_ready_batch(client, batch_id)
    assert client.post(f"/batches/{batch_id}/publish", headers=HEADERS).status_code == 200

    assert client.post(f"/batches/{batch_id}/publish", headers=HEADERS).status_code == 409
    assert client.post(f"/batches/{batch_id}/extract", headers=HEADERS).status_code == 409
    assert _upload(client, batch_id).status_code == 409

    assert client.get(f"/batches/{batch_id}", headers=HEADERS).json()["status"] == "PUBLISHED"
    assert client.get(f"/batches/{batch_id}/verify").json()["verified"] is True


def test_publish_before_extraction_is_rejected(client, mock_chain):
    client.post("/batches", json=_batch_payload("VA-FLOW-3"), headers=HEADERS)
    response = client.post("/batches/VA-FLOW-3/publish", headers=HEADERS)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "ATTESTATION_NOT_READY"


class _RevertingChain(MockBatchHashRegistryClient):
    def get_receipt(self, tx_hash: str) -> ChainReceipt:
        return ChainReceipt(tx_hash=tx_hash, block_number=1, status=0)


class _BrokenChain(MockBatchHashRegistryClient):
    def publish(self, batch_id_hash: bytes, attestation_hash: bytes) -> str:
        raise ConnectionError("rpc down")

    def get(self, batch_id_hash: bytes):
        raise ConnectionError("rpc down")


def test_reverted_publish_does_not_mark_batch_published(client):
    client.app.dependency_overrides[get_chain_client] = lambda: _RevertingChain()
    _prepare_ready_batch(client, "VA-CHAIN-1")

    response = client.post("/batches/VA-CHAIN-1/publish", headers=HEADERS)
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "BLOCKCHAIN_ERROR"
    assert client.get("/batches/VA-CHAIN-1", headers=HEADERS).json()["status"] == "READY"


def test_chain_outage_returns_502(client):
    client.app.dependency_overrides[get_chain_client] = lambda: _BrokenChain()
    _prepare_ready_batch(client, "VA-CHAIN-2")

    assert client.post("/batches/VA-CHAIN-2/publish", headers=HEADERS).status_code == 502
    assert client.get("/batches/VA-CHAIN-2/verify").status_code == 502


def test_verify_registered_batch_without_extraction_is_unpublished(client):
    client.post("/batches", json=_batch_payload("VA-VERIFY-1"), headers=HEADERS)
    response = client.get("/batches/VA-VERIFY-1/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unpublished"
    assert data["offchainHash"] is None
    assert data["labReport"] is None
    assert data["product"]["productName"] == "Vitamin A 10,000 IU"


def test_verify_unknown_batch_is_404(client):
    response = client.get("/batches/NOPE-1/verify")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "BATCH_NOT_FOUND"


def test_auth_check(client):
    assert client.get("/auth/check", headers=HEADERS).json() == {"ok": True}
    assert client.get("/auth/check", headers={"X-API-Key": "nope"}).status_code == 401


def test_chain_info_is_public_and_hides_address_in_mock_mode(client):
    original = (config.settings.chain_name, config.settings.contract_address, config.settings.chain_mode)
    config.settings.chain_name = "initia-evm"
    config.settings.contract_address = "0xABCDEF0000000000000000000000000000000001"
    try:
        config.settings.chain_mode = "real"
        real = client.get("/chain/info").json()
        assert real["chainName"] == "initia-evm"
        assert real["mode"] == "real"
        assert real["contractAddress"] == "0xabcdef0000000000000000000000000000000001"

        config.settings.chain_mode = "mock"
        mock = client.get("/chain/info").json()
        assert mock["mode"] == "mock"
        assert mock["contractAddress"] is None
    finally:
        config.settings.chain_name, config.settings.contract_address, config.settings.chain_mode = original
