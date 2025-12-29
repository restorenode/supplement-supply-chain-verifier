# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Publisher  │  │   Consumer   │  │   Wallet     │         │
│  │   Dashboard  │  │ Verification │  │  Connection  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬──────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                    Backend API (Express/FastAPI)              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              OpenAPI REST Endpoints                     │ │
│  │  • POST /api/batches/upload                              │ │
│  │  • POST /api/batches/:id/attest                          │ │
│  │  • GET  /api/batches/:id/verify                          │ │
│  │  • GET  /api/batches/:id/data                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   PDF        │  │   Hash       │  │   Blockchain │       │
│  │   Processor  │  │   Generator  │  │   Service    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐                                            │
│  │   AI         │                                            │
│  │   Extractor  │  (OpenAI API or Local LLM)                │
│  └──────────────┘                                            │
└────────────┬────────────────────────────┬─────────────────────┘
             │                            │
             │                            │
    ┌────────▼────────┐         ┌─────────▼──────────┐
    │   PostgreSQL    │         │   File Storage     │
    │   Database      │         │   (PDFs)           │
    │                 │         │                    │
    │ • batches       │         │ • lab_reports/     │
    │ • attestations  │         │                    │
    │ • documents     │         │                    │
    └─────────────────┘         └────────────────────┘
             │
             │
    ┌────────▼──────────────────────────────────────┐
    │         Initia EVM Blockchain                  │
    │                                                │
    │  ┌──────────────────────────────────────────┐ │
    │  │   BatchRegistry Smart Contract           │ │
    │  │                                          │ │
    │  │   • attestBatch(batchId, hash)          │ │
    │  │   • getAttestation(batchId)             │ │
    │  │   • AttestationCreated event            │ │
    │  └──────────────────────────────────────────┘ │
    └────────────────────────────────────────────────┘
```

## Data Model Overview

### Database Tables

#### `batches`
- `id` (UUID, PK)
- `batch_id` (VARCHAR, UNIQUE) - Public batch identifier (e.g., "BATCH-2024-001")
- `product_name` (VARCHAR)
- `manufacturer_name` (VARCHAR)
- `production_date` (DATE)
- `expiration_date` (DATE, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### `documents`
- `id` (UUID, PK)
- `batch_id` (UUID, FK → batches.id)
- `file_path` (VARCHAR) - Path to stored PDF file
- `file_hash` (VARCHAR) - SHA-256 hash of PDF
- `file_size` (INTEGER) - Size in bytes
- `mime_type` (VARCHAR) - "application/pdf"
- `uploaded_at` (TIMESTAMP)
- `uploaded_by` (VARCHAR) - Publisher wallet address

#### `attestations`
- `id` (UUID, PK)
- `batch_id` (UUID, FK → batches.id)
- `document_id` (UUID, FK → documents.id)
- `on_chain_hash` (VARCHAR) - Hash stored on blockchain
- `blockchain_tx_hash` (VARCHAR) - Transaction hash
- `blockchain_block_number` (BIGINT)
- `publisher_address` (VARCHAR) - Wallet address of publisher
- `attested_at` (TIMESTAMP)
- `verified` (BOOLEAN) - Whether hash matches document hash

#### `extracted_data`
- `id` (UUID, PK)
- `document_id` (UUID, FK → documents.id)
- `ingredients` (JSONB) - Array of ingredient names and amounts
- `test_results` (JSONB) - Array of test name, value, unit, pass/fail
- `lab_name` (VARCHAR, nullable)
- `test_date` (DATE, nullable)
- `raw_extraction` (JSONB) - Full AI extraction output for debugging
- `extracted_at` (TIMESTAMP)

### Key Relationships
- One `batch` can have multiple `documents` (versioning)
- One `document` has one `extracted_data` record
- One `batch` can have multiple `attestations` (if re-attested)
- Each `attestation` references one `document`

## API Surface Overview

### Batch Management

#### `POST /api/batches/upload`
- **Purpose**: Upload a lab report PDF and extract data
- **Request**: Multipart form data with PDF file
- **Response**: Batch ID, extracted data preview, document hash
- **Status**: 201 Created

#### `POST /api/batches/:batchId/attest`
- **Purpose**: Publish blockchain attestation for a batch
- **Request**: Batch ID, publisher wallet address
- **Response**: Transaction hash, block number
- **Status**: 200 OK

### Verification

#### `GET /api/batches/:batchId/verify`
- **Purpose**: Verify a batch's blockchain attestation
- **Request**: Batch ID (path parameter)
- **Response**: Verification status (verified/unverified/not_found), on-chain hash, off-chain hash match
- **Status**: 200 OK

#### `GET /api/batches/:batchId/data`
- **Purpose**: Retrieve extracted lab report data for a batch
- **Request**: Batch ID (path parameter)
- **Response**: Product info, ingredients, test results, attestation metadata
- **Status**: 200 OK

### Health & Status

#### `GET /api/health`
- **Purpose**: Health check endpoint
- **Response**: Service status, database connectivity, blockchain connectivity
- **Status**: 200 OK

## Smart Contract Responsibilities

### Contract: `BatchRegistry`

#### Functions

**`attestBatch(string memory batchId, bytes32 documentHash)`**
- **Purpose**: Register a batch attestation on-chain
- **Parameters**:
  - `batchId`: Public batch identifier (string)
  - `documentHash`: SHA-256 hash of the lab report PDF (bytes32)
- **Access**: Public (anyone can call)
- **Effects**: Stores mapping of batchId → Attestation struct
- **Emits**: `AttestationCreated` event

**`getAttestation(string memory batchId) → (bytes32 hash, address publisher, uint256 timestamp)`**
- **Purpose**: Retrieve attestation data for a batch
- **Parameters**: `batchId` (string)
- **Returns**: Document hash, publisher address, timestamp
- **Access**: Public view function

**`hasAttestation(string memory batchId) → bool`**
- **Purpose**: Check if a batch has been attested
- **Parameters**: `batchId` (string)
- **Returns**: Boolean indicating existence
- **Access**: Public view function

#### Events

**`AttestationCreated(string indexed batchId, bytes32 documentHash, address indexed publisher, uint256 timestamp)`**
- **Purpose**: Emitted when a new attestation is created
- **Indexed Fields**: `batchId`, `publisher` (for efficient filtering)
- **Data**: Full attestation details

#### Storage Structure

```solidity
struct Attestation {
    bytes32 documentHash;
    address publisher;
    uint256 timestamp;
}

mapping(string => Attestation) public attestations;
```

#### Design Decisions
- **String batchId**: Allows human-readable identifiers (e.g., "BATCH-2024-001")
- **bytes32 hash**: Fixed-size type for efficient storage and gas costs
- **No update/delete**: Immutable attestations (simplifies MVP, can add revocation later)
- **Public functions**: No access control in MVP (can add role-based restrictions later)

## Data Flow Examples

### Attestation Flow
1. Frontend uploads PDF → Backend API
2. Backend stores PDF → File Storage
3. Backend generates hash → SHA-256 of PDF
4. Backend extracts data → AI service
5. Backend stores metadata → PostgreSQL
6. Frontend calls attest endpoint → Backend API
7. Backend calls smart contract → Initia EVM
8. Smart contract emits event → Blockchain
9. Backend stores tx hash → PostgreSQL
10. Frontend displays success → User

### Verification Flow
1. Frontend requests verification → Backend API (batch ID)
2. Backend queries database → PostgreSQL (get document hash)
3. Backend queries blockchain → Initia EVM (get on-chain hash)
4. Backend compares hashes → Verification logic
5. Backend retrieves extracted data → PostgreSQL
6. Backend returns result → Frontend
7. Frontend displays verification status + lab data → User

## Technology Integration Points

- **Frontend ↔ Backend**: REST API over HTTP/HTTPS
- **Backend ↔ Database**: PostgreSQL connection pool
- **Backend ↔ Blockchain**: JSON-RPC to Initia EVM node (via ethers.js/viem)
- **Backend ↔ AI Service**: HTTP API calls (OpenAI) or local model inference
- **Backend ↔ File Storage**: Filesystem API or S3 SDK

