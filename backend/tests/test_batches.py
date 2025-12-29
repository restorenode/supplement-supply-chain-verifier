def test_create_and_get_batch(client):
    payload = {
        "batchId": "VA-2025-0001",
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
        "expiresDate": "2027-01-15",
    }
    headers = {"X-API-Key": "test-key"}

    create_response = client.post("/batches", json=payload, headers=headers)
    assert create_response.status_code == 201
    data = create_response.json()
    assert data["batchId"] == payload["batchId"]
    assert data["status"] == "DRAFT"

    get_response = client.get(f"/batches/{payload['batchId']}", headers=headers)
    assert get_response.status_code == 200
    fetched = get_response.json()
    assert fetched["batchId"] == payload["batchId"]
    assert fetched["productName"] == payload["productName"]


def test_create_batch_requires_api_key(client):
    payload = {
        "batchId": "VA-2025-0002",
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
    }

    response = client.post("/batches", json=payload)
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_create_batch_duplicate(client):
    payload = {
        "batchId": "VA-2025-0003",
        "productName": "Vitamin A 10,000 IU",
        "supplementType": "Vitamin A",
        "manufacturer": "PureSupplements Inc.",
        "productionDate": "2025-01-15",
    }
    headers = {"X-API-Key": "test-key"}

    first = client.post("/batches", json=payload, headers=headers)
    assert first.status_code == 201

    second = client.post("/batches", json=payload, headers=headers)
    assert second.status_code == 409
    body = second.json()
    assert body["error"]["code"] == "BATCH_EXISTS"
