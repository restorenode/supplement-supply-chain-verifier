# API Notes & Conventions

## Authentication Approach

### Admin/Publisher Endpoints
All admin endpoints require the `X-API-Key` header:
```
X-API-Key: your-api-key-here
```

**Implementation Notes:**
- API keys are simple string tokens (no JWT or OAuth in MVP)
- Backend validates the API key against a configured list (environment variable or database)
- Missing or invalid API key returns `401 Unauthorized` with error code `UNAUTHORIZED`
- API keys are issued out-of-band (not via API in MVP)

### Public Endpoints
The `/batches/{batchId}/verify` endpoint requires **no authentication** and is publicly accessible.

**Future Considerations:**
- Rate limiting may be added to prevent abuse
- API keys may be scoped to specific operations or batches
- User accounts and OAuth2 may replace API keys in future versions

## ID Formats

### Batch ID (`batchId`)
- **Format**: Human-friendly, URL-safe string: letters, numbers, dots, dashes and underscores; max 64 characters
- **Pattern**: `^[A-Za-z0-9][A-Za-z0-9._-]*$`
- **Examples**: 
  - `VA-2025-0001` (Vitamin A batch)
  - `OMEGA3-2025-Q1-042`
  - `PROB-2024-999`
- **Purpose**: Easy to read and communicate (e.g., printed on supplement labels)
- **Uniqueness**: Must be globally unique across all batches
- **Case Sensitivity**: Case-sensitive (backend should enforce exact matching)

### Document ID (`documentId`)
- **Format**: UUID v4 (standard UUID format)
- **Example**: `550e8400-e29b-41d4-a716-446655440000`
- **Purpose**: Internal identifier for document storage and retrieval
- **Generation**: Backend generates UUID when document is uploaded

### Transaction Hash (`txHash`)
- **Format**: Ethereum-compatible hex string with `0x` prefix
- **Pattern**: `^0x[a-fA-F0-9]{64}$` (64 hex characters = 32 bytes)
- **Example**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **Purpose**: Blockchain transaction identifier

### Hash Values (`canonicalJsonHash`, `offchainHash`, `onchainHash`)
- **Format**: Keccak-256 hash as hex string with `0x` prefix
- **Pattern**: `^0x[a-fA-F0-9]{64}$`
- **Computation**: 
  - Canonical JSON is serialized deterministically (sorted keys, no whitespace)
  - Keccak-256 hash is computed from the serialized JSON
  - Hash is hex-encoded and prefixed with `0x`
- **Purpose**: Tamper-evident fingerprint of attestation data

## Status Code Strategy

### Success Codes
- **200 OK**: Successful GET/POST/PUT operations
- **201 Created**: Resource created successfully (POST `/batches`, POST `/batches/{batchId}/documents`)

### Client Error Codes
- **400 Bad Request**: Invalid request parameters, malformed data, business rule violations
  - Examples: Invalid batch ID format, missing required fields, invalid file type
- **401 Unauthorized**: Missing or invalid API key (admin endpoints only)
- **404 Not Found**: Resource does not exist
  - Examples: Batch not found, document not found, attestation not found
- **409 Conflict**: Resource conflict (duplicate batch ID; batch already published, so documents and extraction are frozen)
- **413 Payload Too Large**: Upload exceeds `MAX_UPLOAD_BYTES` (default 20 MB)
- **415 Unsupported Media Type**: Upload is not a PDF

### Server Error Codes
- **500 Internal Server Error**: Unexpected server errors (e.g. database failure)
- **502 Bad Gateway**: Upstream failure: blockchain RPC or reverted transaction (`BLOCKCHAIN_ERROR`), LLM provider (`LLM_ERROR`)

**Note**: All error responses follow the standard `Error` schema with `code`, `message`, and optional `details`.

## Endpoint Usage Guide

### `/batches/{batchId}/verify` vs `/batches/{batchId}/attestation`

#### `/batches/{batchId}/verify` (Public)
**Purpose**: Consumer-facing verification endpoint

**Use Cases:**
- Consumer enters batch ID from supplement packaging
- Retailer verifies batch authenticity before sale
- Public verification without authentication

**Response Includes:**
- `verified`: Boolean indicating if hashes match
- `status`: `verified`, `mismatch` (on-chain hash differs) or `unpublished` (nothing sealed yet)
- `offchainHash`: Hash recomputed from the stored record (null until extraction)
- `onchainHash`: Hash from the registry (null if not published)
- `txHash`, `chain`, `publishedAt`: Where and when the record was sealed
- `mismatchReason`: Explanation when not verified
- `product`: Product name, manufacturer, supplement type, production and expiry dates
- `labReport`: Extracted lab name, report date, analytes, contaminants and methods (null until extraction)

**When to Use:**
- ✅ Public verification flows
- ✅ Consumer-facing applications
- ✅ Display verification status to end users
- ✅ No authentication required

#### `/batches/{batchId}/attestation` (Admin)
**Purpose**: Publisher-facing endpoint to view attestation data before/after publishing

**Use Cases:**
- Publisher wants to review canonical JSON before publishing
- Publisher wants to check publication status
- Publisher needs to see the hash that will be/was published

**Response Includes:**
- `canonicalJson`: Full attestation data structure
- `canonicalJsonHash`: Hash that is/will be published
- `published`: Whether it's been published
- `txHash`, `publisherAddress`, `publishedAt`: Publication details

**When to Use:**
- ✅ Publisher dashboard workflows
- ✅ Review attestation data before publishing
- ✅ Debugging attestation issues
- ✅ Requires API key authentication

**Key Difference:**
- `/verify` focuses on **verification status** (hashes match?)
- `/attestation` focuses on **attestation data** (what is/will be published?)

## Canonical JSON Format

The `canonicalJson` field in attestations must be serialized deterministically:

1. **Key Ordering**: Keys sorted alphabetically
2. **No Whitespace**: Compact JSON (no spaces, newlines)
3. **Consistent Encoding**: UTF-8 encoding
4. **No Trailing Commas**: Valid JSON only

**Example Canonical JSON:**
```json
{"batchId":"VA-2025-0001","contaminants":{"lead":"< 0.1 ppm"},"manufacturer":"PureSupplements Inc.","potency":{"vitaminA":"10,000 IU"},"productionDate":"2025-01-15","productName":"Vitamin A 10,000 IU","supplementType":"Vitamin A","testDate":"2025-01-18"}
```

**Implementation Note**: The backend serializes with `json.dumps(..., sort_keys=True, separators=(",", ":"), ensure_ascii=True)` (`app/attestation/canonical.py`) and hashes the result with Keccak-256. The canonical JSON also includes the PDF's SHA-256 `documentFingerprint` and a `schemaVersion`.

## File Upload Conventions

### Document Upload (`POST /batches/{batchId}/documents`)
- **Content-Type**: `multipart/form-data`
- **Field Name**: `file`
- **Accepted Types**: `application/pdf` only (in MVP)
- **Size Limits**: Enforced by the backend (`MAX_UPLOAD_BYTES`, default 20 MB); the file must start with `%PDF-`
- **Storage**: The PDF is stored in the database with its SHA-256 fingerprint; the response returns document metadata

**Request Example:**
```
POST /batches/VA-2025-0001/documents
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
X-API-Key: your-api-key

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="lab-report.pdf"
Content-Type: application/pdf

[PDF binary data]
------WebKitFormBoundary--
```

## Blockchain Integration

### Publishing (`POST /batches/{batchId}/publish`)
- **Network**: Base (Ethereum L2); Base Sepolia testnet by default. Set with `CHAIN_NETWORK`
  (`base-sepolia`, `base`, `sepolia`, `ethereum`, `initia-evm`).
- **Smart Contract**: `BatchHashRegistry.publish(bytes32 batchIdHash, bytes32 attestationHash)`
  - `batchIdHash = keccak256(batchId)`, `attestationHash = keccak256(canonical JSON)`
- **Signer**: the backend's publisher key (`PUBLISHER_PRIVATE_KEY`); clients never hold a wallet.

**Transaction Flow:**
1. Backend checks the batch is `READY` (409 if already published, 400 if not extracted).
2. Backend recomputes the canonical JSON and its Keccak-256 hash.
3. Backend signs and sends `publish(...)` (EIP-1559 fees; legacy only on Initia EVM).
4. Backend waits for the receipt and checks its status; a reverted transaction returns 502.
5. Backend stores the network, `txHash`, publisher address and `publishedAt`.
6. Backend returns `txHash`, `blockNumber` and `publishedAt`.

**Error Handling:**
- `ALREADY_PUBLISHED` revert from the contract: `409 Conflict`
- RPC failure or reverted transaction: `502` with code `BLOCKCHAIN_ERROR`

### Network details (`GET /chain/info`, public)
Returns the active network (`network`, `displayName`, `chainId`, `testnet`), `mode` (`real` or
`mock`), the registry `contractAddress` and the block-explorer base `explorerUrl`. In mock mode the
contract address and explorer URL are null, since mock transactions do not exist on a real chain.

### Mock mode (`CHAIN_MODE=mock`)
A local registry mirrors the contract (one seal per batch), issues realistic block numbers for the
selected network, and persists to `MOCK_CHAIN_PATH` (default `mock_chain.json`) across restarts.

## Rate Limiting (Future)

While not in MVP, consider adding rate limiting:
- **Admin Endpoints**: Higher limits (e.g., 100 requests/minute per API key)
- **Public Verify Endpoint**: Lower limits (e.g., 10 requests/minute per IP)

## Versioning

API versioning strategy (for future):
- **Current**: No version prefix (MVP)
- **Future**: `/v1/batches`, `/v2/batches` or header-based versioning

## Testing Recommendations

### Test Cases for Frontend
1. **Create Batch**: POST with valid/invalid data
2. **Upload Document**: Multipart upload with PDF
3. **Extract Data**: Trigger extraction, verify response structure
4. **Get Attestation**: Verify canonical JSON structure
5. **Publish**: Mock blockchain response, verify txHash returned
6. **Verify**: Test verified/unverified/not-found scenarios
7. **Error Handling**: Test 400/401/404/500 responses

### Mock Data for Development
- Use test batch IDs: `TEST-2025-0001`, `TEST-2025-0002`
- Use test API key: `test-api-key-12345`
- Mock publisher address: `0x0000000000000000000000000000000000000000`
- Sample Certificate of Analysis: `backend/tests/fixtures/sample_coa.pdf` (also linked from the publisher console); use `LLM_PROVIDER=demo` to extract its results offline
- Use `CHAIN_MODE=mock` for local development

