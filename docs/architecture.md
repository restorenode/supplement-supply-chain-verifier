# Architecture Overview

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14, React)               │
│   Home  ·  Verify (public)  ·  Publisher console (API key)    │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS / JSON (OpenAPI: openapi.yaml)
┌──────────────────────────────▼────────────────────────────────┐
│                      Backend API (FastAPI)                    │
│                                                               │
│   Batches · Documents · Extraction · Attestation · Verify     │
│                                                               │
│   ┌────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│   │ PDF text   │   │ Extractor    │   │ Chain client     │    │
│   │ (PyMuPDF)  │   │ mock | demo  │   │ web3.py | mock   │    │
│   │            │   │ | openai     │   │ registry         │    │
│   └────────────┘   └──────────────┘   └────────┬─────────┘    │
└───────────────┬────────────────────────────────┼──────────────┘
                │ SQLAlchemy                     │ JSON-RPC
       ┌────────▼─────────┐            ┌─────────▼─────────────────┐
       │ PostgreSQL       │            │ Base (Ethereum L2)        │
       │ (SQLite locally) │            │ Base Sepolia by default   │
       │                  │            │                           │
       │ batches          │            │ BatchHashRegistry         │
       │ documents (PDF)  │            │  publish(bytes32, bytes32)│
       │ extractions      │            │  get(bytes32) → bytes32   │
       └──────────────────┘            └───────────────────────────┘
```

The network is selected with `CHAIN_NETWORK` (presets in `backend/app/chain/networks.py`:
`base-sepolia`, `base`, `sepolia`, `ethereum`, `initia-evm`). With `CHAIN_MODE=mock`, a local registry
that mirrors the contract replaces the RPC calls and persists to `MOCK_CHAIN_PATH`.

## Data Model

### `batches`
- `batch_id` (VARCHAR(64), PK): public batch identifier, e.g. `VA-2025-0001`
- `product_name`, `supplement_type`, `manufacturer` (VARCHAR)
- `production_date` (DATE), `expires_date` (DATE, nullable)
- `status` (`DRAFT` → `READY` → `PUBLISHED`)
- `chain` (network key the record was sealed on), `tx_hash`, `publisher_address`, `published_at`

### `documents`
- `document_id` (UUID, PK), `batch_id`
- `filename`, `content_type`, `uploaded_at`
- `data` (BLOB): the Certificate of Analysis PDF
- `fingerprint`: SHA-256 of the PDF bytes

### `extractions`
- `batch_id` (PK)
- `extracted_fields` (JSON): lab, report date, potency, analytes, contaminants, methods, notes
- `model_info` (JSON), `extracted_at`
- `document_fingerprint`: the PDF fingerprint the extraction was made from

Schema changes are managed with Alembic (`backend/alembic`). Once a batch is `PUBLISHED`, its
documents and extraction can no longer change.

## API Surface

Full specification: `openapi.yaml`. Admin endpoints require the `X-API-Key` header.

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | public | Health check |
| `GET` | `/auth/check` | admin | Validate an API key |
| `POST` | `/batches` | admin | Register a batch |
| `GET` | `/batches/{batchId}` | admin | Read a batch |
| `POST` | `/batches/{batchId}/documents` | admin | Upload the Certificate of Analysis (PDF, ≤ 20 MB) |
| `POST` | `/batches/{batchId}/extract` | admin | Extract test results from the latest PDF |
| `GET` | `/batches/{batchId}/attestation` | admin | Canonical JSON and its Keccak-256 hash |
| `POST` | `/batches/{batchId}/publish` | admin | Seal the hash on-chain |
| `GET` | `/batches/{batchId}/verify` | public | Compare the recomputed hash with the on-chain hash |
| `GET` | `/chain/info` | public | Network, chain ID, explorer and registry address |

## Smart Contract: `BatchHashRegistry`

Source: `contracts/src/BatchHashRegistry.sol` (Foundry).

```solidity
mapping(bytes32 => bytes32) public attestationHashByBatchId;

function publish(bytes32 batchIdHash, bytes32 attestationHash) external;   // reverts ALREADY_PUBLISHED
function get(bytes32 batchIdHash) external view returns (bytes32);
event Published(bytes32 indexed batchIdHash, bytes32 attestationHash, address publisher, uint256 timestamp);
```

- `batchIdHash = keccak256(batchId)`: the plain batch ID never appears on-chain.
- `attestationHash = keccak256(canonical JSON)`: the canonical JSON covers the batch details, the
  extracted results and the PDF's SHA-256 fingerprint, serialized with sorted keys and no whitespace.
- One seal per batch; there is no update or delete.

## Data Flows

### Publish
1. Publisher registers the batch (`POST /batches`).
2. Publisher uploads the PDF; the backend stores it and its SHA-256 fingerprint.
3. Extraction reads the PDF text and produces structured results; the batch becomes `READY`.
4. The backend builds the canonical JSON and its Keccak-256 hash (`GET /attestation`).
5. `POST /publish` calls `publish(batchIdHash, attestationHash)`, waits for the receipt, checks its
   status, and stores the network, transaction hash and time. The batch becomes `PUBLISHED`.

### Verify
1. Anyone requests `GET /batches/{batchId}/verify`.
2. The backend recomputes the canonical JSON hash from the stored record.
3. It reads `get(batchIdHash)` from the registry.
4. It returns `verified`, `mismatch` or `unpublished`, with the product details, lab results and both hashes.

## Integration Points

- **Frontend ↔ Backend:** REST over HTTPS; CORS allows `*.vercel.app` and localhost by default.
- **Backend ↔ Database:** SQLAlchemy (PostgreSQL in Docker/production, SQLite locally).
- **Backend ↔ Blockchain:** web3.py over JSON-RPC; EIP-1559 fees except on Initia EVM.
- **Backend ↔ Extraction:** `mock` (tests), `demo` (offline rule-based parser), or an OpenAI-compatible API.
