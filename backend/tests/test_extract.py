from pathlib import Path


def test_extract_marks_batch_ready_and_stores_extraction(client):
    payload = {
        "batchId": "VA-2025-EXTRACT-1",
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
    }
    headers = {"X-API-Key": "test-key"}

    create_response = client.post("/batches", json=payload, headers=headers)
    assert create_response.status_code == 201

    pdf_bytes = (Path(__file__).parent / "fixtures" / "sample.pdf").read_bytes()
    files = {"file": ("sample.pdf", pdf_bytes, "application/pdf")}
    upload_response = client.post(f"/batches/{payload['batchId']}/documents", files=files, headers=headers)
    assert upload_response.status_code == 201

    extract_response = client.post(f"/batches/{payload['batchId']}/extract", headers=headers)
    assert extract_response.status_code == 200
    data = extract_response.json()
    assert data["batchId"] == payload["batchId"]
    assert data["extractedFields"]["confidence"] == 0.1

    get_response = client.get(f"/batches/{payload['batchId']}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "READY"


def test_attestation_hash_stable(client):
    payload = {
        "batchId": "VA-2025-EXTRACT-2",
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
    }
    headers = {"X-API-Key": "test-key"}

    client.post("/batches", json=payload, headers=headers)

    pdf_bytes = (Path(__file__).parent / "fixtures" / "sample.pdf").read_bytes()
    files = {"file": ("sample.pdf", pdf_bytes, "application/pdf")}
    client.post(f"/batches/{payload['batchId']}/documents", files=files, headers=headers)
    client.post(f"/batches/{payload['batchId']}/extract", headers=headers)

    first = client.get(f"/batches/{payload['batchId']}/attestation", headers=headers)
    second = client.get(f"/batches/{payload['batchId']}/attestation", headers=headers)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["canonicalJsonHash"] == second.json()["canonicalJsonHash"]
