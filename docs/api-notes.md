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
- **Format**: Human-friendly string with uppercase letters, numbers, and hyphens
- **Pattern**: `^[A-Z0-9-]+$`
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
- **Format**: SHA-256 hash as hex string with `0x` prefix
- **Pattern**: `^0x[a-fA-F0-9]{64}$`
- **Computation**: 
  - Canonical JSON is serialized deterministically (sorted keys, no whitespace)
  - SHA-256 hash is computed from the serialized JSON bytes
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
- **409 Conflict**: Resource conflict (e.g., duplicate batch ID)

### Server Error Codes
- **500 Internal Server Error**: Unexpected server errors
  - Examples: Database connection failure, blockchain RPC failure, AI extraction failure

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
- `offchainHash`: Hash from database
- `onchainHash`: Hash from blockchain (null if not published)
- `mismatchReason`: Explanation if verification fails
- `attestation`: Summary data for display (product name, manufacturer, etc.)

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

**Implementation Note**: Use a JSON canonicalization library (e.g., `canonicaljson` for Node.js or `canonicaljson` for Python) to ensure consistent hashing.

## File Upload Conventions

### Document Upload (`POST /batches/{batchId}/documents`)
- **Content-Type**: `multipart/form-data`
- **Field Name**: `file`
- **Accepted Types**: `application/pdf` only (in MVP)
- **Size Limits**: Backend should enforce reasonable limits (e.g., 10MB max)
- **Storage**: Backend stores file and returns `storageUrl` or `signedUrl`

**Request Example:**
```
POST /api/batches/VA-2025-0001/documents
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
- **Network**: Initia EVM testnet (in MVP)
- **Smart Contract**: `BatchRegistry.attestBatch(batchId, hash)`
- **Hash Format**: `bytes32` (32 bytes, hex-encoded)
- **Publisher Address**: Ethereum-compatible address (`0x...`)

**Transaction Flow:**
1. Backend receives publish request with `publisherAddress`
2. Backend retrieves `canonicalJsonHash` from database
3. Backend converts hex string to `bytes32`
4. Backend calls smart contract with publisher's wallet (via RPC or wallet provider)
5. Backend waits for transaction confirmation
6. Backend stores `txHash`, `blockNumber`, `publishedAt` in database
7. Backend returns success response

**Error Handling:**
- If transaction fails (revert, insufficient gas, etc.), return `500` with error details
- If blockchain RPC is unavailable, return `500` with appropriate error code

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
- Use test wallet address: `0x0000000000000000000000000000000000000000`
- Mock blockchain responses for local development

