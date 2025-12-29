# Supplement Supply Chain Verification Protocol

## Problem Statement

The supplement industry faces significant challenges with product authenticity, quality verification,
and supply chain transparency. Consumers and retailers lack reliable ways to verify that supplement
batches meet claimed specifications and originate from legitimate sources. Lab reports and certificates
of analysis (COAs) are often difficult to access, verify, or may be falsified.

This system enables supplement manufacturers and distributors to publish tamper-evident attestations
about batch quality and origin. By storing only cryptographic hashes on-chain (not full documents), we
maintain privacy while ensuring data integrity.

## User Roles

### Admin/Publisher
- Manufacturers: Companies that produce supplement batches
- Distributors: Entities that handle supplement distribution
- Responsibilities:
  - Upload lab report PDFs for supplement batches
  - Publish attestations linking batch IDs to document hashes
  - Manage batch metadata (product name, batch number, production date, etc.)

### Consumer
- End consumers: Individuals purchasing supplements
- Retailers: Stores selling supplements to consumers
- Responsibilities:
  - Verify supplement batches by batch ID
  - View extracted lab report data (off-chain)
  - Verify attestation integrity

## Core User Flows

### 1. Publish Attestation Flow (Publisher)
1. Publisher uploads a lab report PDF for a supplement batch
2. System extracts key data from PDF using AI (batch ID, product name, test results, etc.)
3. System generates a cryptographic hash of the PDF document
4. Publisher reviews extracted data and confirms
5. System publishes an attestation containing:
   - Batch ID
   - Document hash
   - Timestamp
   - Publisher address
6. System stores full document and extracted data off-chain in database

### 2. Verify Batch Flow (Consumer)
1. Consumer enters a batch ID (e.g., from supplement packaging)
2. System queries the attestation registry for the batch ID
3. System retrieves off-chain document hash from database
4. System verifies that on-chain hash matches off-chain hash
5. Consumer views extracted lab report data (test results, ingredients, etc.)
6. System displays verification status (verified/unverified/not found)

## What Is On-Chain vs Off-Chain

### On-Chain (Attestation Registry)
- Batch attestations: Minimal registry entries containing:
  - Batch ID (identifier)
  - Document hash (SHA-256 hash of PDF)
  - Publisher address (who attested)
  - Timestamp (when attested)
- Purpose: Tamper-evident proof that a specific batch was attested at a specific time by a specific entity

### Off-Chain (Database)
- Full lab report PDFs: Original documents
- Extracted data: AI-parsed information (ingredients, test results, dates, etc.)
- Metadata: Product names, batch numbers, production dates, publisher info
- Purpose: Efficient storage and retrieval of detailed information without bloating the chain

## Tech Stack

### Frontend
- Framework: Next.js (React + TypeScript)
- Styling: Tailwind CSS

### Backend
- Runtime: Python + FastAPI
- API: OpenAPI/Swagger specification
- Database: PostgreSQL (SQLite for local/dev)

### AI/ML
- PDF processing and extraction via server-side pipeline
- LLM provider configurable; mock provider available for deterministic tests

### Blockchain
- Registry client with mock mode for local and integration tests

### DevOps
- Containerization: Docker + Docker Compose
- Testing: pytest

## Backend + Frontend (Docker)

1) Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

2) Build and start services:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

## Tests

### Backend unit tests

```bash
cd backend
python3 -m pytest
```

### Backend integration tests (Docker)

Start Docker first:

```bash
docker compose up --build -d
```

Then run:

```bash
cd backend
INTEGRATION_BASE_URL=http://localhost:8000 \
INTEGRATION_API_KEY=$ADMIN_API_KEY \
python3 -m pytest integration_tests
```

Or use the helper script (reads `ADMIN_API_KEY` from `./.env` if set):

```bash
./backend/scripts/run_integration_tests.sh
```
