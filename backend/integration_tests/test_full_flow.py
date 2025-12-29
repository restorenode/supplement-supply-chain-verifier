import os
import time
from pathlib import Path

import httpx


BASE_URL = os.getenv("INTEGRATION_BASE_URL", "http://127.0.0.1:8000")


def _load_api_key() -> str:
    api_key = os.getenv("INTEGRATION_API_KEY")
    if api_key:
        return api_key
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("ADMIN_API_KEY="):
                return line.split("=", 1)[1].strip()
    raise AssertionError("Set INTEGRATION_API_KEY or ADMIN_API_KEY in .env before running integration tests.")


API_KEY = _load_api_key()


def wait_for_backend(client: httpx.Client, timeout_seconds: int = 60) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        try:
            response = client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                return
        except httpx.HTTPError:
            pass
        time.sleep(2)
    raise AssertionError(f"Backend not healthy after {timeout_seconds}s at {BASE_URL}")


def test_full_flow():
    batch_id = "INT-2025-0001"
    headers = {"X-API-Key": API_KEY}

    create_payload = {
        "batchId": batch_id,
        "productName": "Integration Test Product",
        "supplementType": "Vitamin",
        "manufacturer": "Test Labs",
        "productionDate": "2025-01-01",
        "expiresDate": "2026-01-01",
    }

    with httpx.Client(timeout=10.0) as client:
        wait_for_backend(client)
        create = client.post(f"{BASE_URL}/batches", json=create_payload, headers=headers)
        if create.status_code not in (201, 409):
            assert False, f"Create failed: {create.status_code} {create.text}"

        pdf_path = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "sample.pdf"
        with pdf_path.open("rb") as handle:
            files = {"file": ("sample.pdf", handle, "application/pdf")}
            upload = client.post(f"{BASE_URL}/batches/{batch_id}/documents", files=files, headers=headers)
            assert upload.status_code == 201

        extract = client.post(f"{BASE_URL}/batches/{batch_id}/extract", headers=headers)
        assert extract.status_code == 200

        attestation = client.get(f"{BASE_URL}/batches/{batch_id}/attestation", headers=headers)
        assert attestation.status_code == 200
        attestation_hash = attestation.json()["canonicalJsonHash"]
        assert attestation_hash.startswith("0x")

        publish = client.post(f"{BASE_URL}/batches/{batch_id}/publish", headers=headers)
        assert publish.status_code == 200

        verify = client.get(f"{BASE_URL}/batches/{batch_id}/verify")
        assert verify.status_code == 200
        assert verify.json()["verified"] is True
