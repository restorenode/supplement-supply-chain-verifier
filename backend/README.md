# Ethical Supplement Supply Chain Verifier (Backend)

## Setup

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
python3 -m pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and update values as needed. Required variables:

- `DATABASE_URL`
- `ADMIN_API_KEY`
- `ENV` (`dev`, `test`, `prod`)
- `CHAIN_RPC_URL`
- `CONTRACT_ADDRESS`
- `PUBLISHER_PRIVATE_KEY`
- `CHAIN_ID`
- `CHAIN_NAME` (optional label stored with published batches)

## Run the app

```bash
python3 -m uvicorn app.main:app --reload
```

## Run tests

```bash
python3 -m pytest
```

If you have Homebrew Python/uvicorn installed on macOS, using `python3 -m ...` ensures the venv
site-packages are used instead of the system/Homebrew ones.

## Chain adapter and verification logic

The chain client lives in `app/chain/client.py` and uses web3.py with legacy (non-EIP-1559)
transactions to publish batch attestation hashes to the Initia EVM `BatchHashRegistry` contract.

Verification recomputes the canonical JSON hash for the batch, reads the on-chain hash, and returns
`verified: true` only when both hashes match and an on-chain value exists.
