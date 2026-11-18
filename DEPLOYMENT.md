# Deployment Guide

Recommended approach:
- Frontend: Vercel
- Backend: Render Web Service (Docker)
- Database: Render Postgres

## Step-by-step

### 1) Create Render Postgres
1. Create a new Render Postgres instance.
2. Copy the `DATABASE_URL` from the Render dashboard.

### 2) Deploy backend on Render
1. Create a new Render Web Service from this repo.
2. Use the Dockerfile at `backend/Dockerfile`.
3. Set environment variables:
   - `DATABASE_URL` (from Render Postgres)
   - `ADMIN_API_KEY`
   - `LLM_PROVIDER=mock` (or `openai`)
   - `CHAIN_MODE=mock` (or `real`)
   - `CHAIN_NETWORK` (`base-sepolia` default; `base` for production)
   - `CONTRACT_ADDRESS`, `PUBLISHER_PRIVATE_KEY` (only if `CHAIN_MODE=real`)
   - `CHAIN_RPC_URL` (optional: your own RPC instead of the preset's public one)
4. Deploy and wait for the service to become healthy.
5. Verify the health endpoint: `https://<your-backend>/health`.

### 3) Deploy frontend on Vercel
1. Create a new Vercel project from `./frontend`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (e.g. `https://<your-backend>`).
3. Deploy.
4. Verify the UI at `https://<your-frontend>/verify`.

## Using real chain vs mock chain

- Mock chain (`CHAIN_MODE=mock`):
  - No RPC credentials required.
  - Faster and safer for demos.
  - Publish/verify uses a local registry that mirrors the contract and persists to `MOCK_CHAIN_PATH`.
- Real chain (`CHAIN_MODE=real`):
  - Requires `CONTRACT_ADDRESS` and `PUBLISHER_PRIVATE_KEY`; the network preset supplies chain ID, RPC and explorer.
  - Deploy the registry first (see `contracts/README.md`); fund the publisher with a little ETH on Base Sepolia or Base.
  - Publish writes an on-chain attestation hash.
  - Verify checks the on-chain registry.

## Required secrets and where to set them

Set these on Render (backend) and Vercel (frontend) as environment variables:

Backend (Render):
- `DATABASE_URL`
- `ADMIN_API_KEY`
- `LLM_PROVIDER`
- `CHAIN_MODE`
- `CHAIN_NETWORK` (network preset)
- `CONTRACT_ADDRESS` (real chain only)
- `PUBLISHER_PRIVATE_KEY` (real chain only)
- `CHAIN_RPC_URL` (optional override)

Frontend (Vercel):
- `NEXT_PUBLIC_API_BASE_URL`
