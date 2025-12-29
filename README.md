# Ethical Supplement Supply Chain Verifier

## Problem Statement

The supplement industry faces significant challenges with product authenticity, quality verification, and supply chain transparency. Consumers and retailers lack reliable ways to verify that supplement batches meet claimed specifications and originate from legitimate sources. Lab reports and certificates of analysis (COAs) are often difficult to access, verify, or may be falsified.

This system enables supplement manufacturers and distributors to publish tamper-evident attestations about batch quality and origin, which consumers and retailers can verify independently using blockchain technology. By storing only cryptographic hashes on-chain (not full documents), we maintain privacy while ensuring data integrity.

## User Roles

### Admin/Publisher
- **Manufacturers**: Companies that produce supplement batches
- **Distributors**: Entities that handle supplement distribution
- **Responsibilities**:
  - Upload lab report PDFs for supplement batches
  - Publish blockchain attestations linking batch IDs to document hashes
  - Manage batch metadata (product name, batch number, production date, etc.)

### Consumer
- **End Consumers**: Individuals purchasing supplements
- **Retailers**: Stores selling supplements to consumers
- **Responsibilities**:
  - Verify supplement batches by batch ID
  - View extracted lab report data (off-chain)
  - Verify blockchain attestation integrity

## Core User Flows

### 1. Publish Attestation Flow (Publisher)
1. Publisher uploads a lab report PDF for a supplement batch
2. System extracts key data from PDF using AI (batch ID, product name, test results, etc.)
3. System generates a cryptographic hash of the PDF document
4. Publisher reviews extracted data and confirms
5. System publishes an on-chain attestation containing:
   - Batch ID
   - Document hash
   - Timestamp
   - Publisher address
6. System stores full document and extracted data off-chain in database

### 2. Verify Batch Flow (Consumer)
1. Consumer enters a batch ID (e.g., from supplement packaging)
2. System queries blockchain for attestation matching batch ID
3. System retrieves off-chain document hash from database
4. System verifies that on-chain hash matches off-chain hash
5. Consumer views extracted lab report data (test results, ingredients, etc.)
6. System displays verification status (verified/unverified/not found)

## What is On-Chain vs Off-Chain

### On-Chain (Initia EVM Blockchain)
- **Batch attestations**: Minimal registry entries containing:
  - Batch ID (identifier)
  - Document hash (SHA-256 hash of PDF)
  - Publisher address (who attested)
  - Timestamp (when attested)
- **Purpose**: Tamper-evident proof that a specific batch was attested at a specific time by a specific entity

### Off-Chain (Database)
- **Full lab report PDFs**: Original documents
- **Extracted data**: AI-parsed information (ingredients, test results, dates, etc.)
- **Metadata**: Product names, batch numbers, production dates, publisher info
- **Purpose**: Efficient storage and retrieval of detailed information without bloating blockchain

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui (or Material-UI)
- **Web3 Integration**: ethers.js or viem for Initia EVM interaction

### Backend
- **Runtime**: Node.js with Express (or Python with FastAPI)
- **API**: OpenAPI/Swagger specification
- **Database**: PostgreSQL
- **File Storage**: Local filesystem or S3-compatible storage

### AI/ML
- **PDF Processing**: pdf-parse or PyPDF2 for text extraction
- **Data Extraction**: OpenAI GPT-4 API (or local LLM) for structured extraction from lab reports

### Blockchain
- **Network**: Initia EVM (Ethereum-compatible)
- **Smart Contracts**: Solidity
- **Development**: Hardhat or Foundry
- **Wallet Integration**: MetaMask or WalletConnect

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Testing**: Jest (Node.js) or pytest (Python)
- **Deployment**: TBD (AWS, Vercel, Railway, etc.)

## Local Run Instructions

### Prerequisites
- Node.js 18+ (or Python 3.10+)
- PostgreSQL 14+
- Docker & Docker Compose
- MetaMask or compatible wallet
- Initia EVM testnet RPC access

### Setup Steps
_(To be filled in during implementation)_

1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Initialize database
5. Deploy smart contracts to testnet
6. Start services with Docker Compose
7. Run migrations
8. Start development servers

### Environment Variables
_(To be filled in during implementation)_

- Database connection string
- Blockchain RPC URL
- Private keys for contract deployment
- OpenAI API key (if using)
- File storage configuration

## License

_(To be determined)_

