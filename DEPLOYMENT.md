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
   - `CHAIN_NAME` (optional label)
   - `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `PUBLISHER_PRIVATE_KEY`, `CHAIN_ID` (only if `CHAIN_MODE=real`)
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
  - Publish/verify uses an in-memory registry on the backend.
- Real chain (`CHAIN_MODE=real`):
  - Requires `CHAIN_RPC_URL`, `CONTRACT_ADDRESS`, `PUBLISHER_PRIVATE_KEY`, and `CHAIN_ID`.
  - Publish writes an on-chain attestation hash.
  - Verify checks the on-chain registry.

## Required secrets and where to set them

Set these on Render (backend) and Vercel (frontend) as environment variables:

Backend (Render):
- `DATABASE_URL`
- `ADMIN_API_KEY`
- `LLM_PROVIDER`
- `CHAIN_MODE`
- `CHAIN_NAME` (optional)
- `CHAIN_RPC_URL` (real chain only)
- `CONTRACT_ADDRESS` (real chain only)
- `PUBLISHER_PRIVATE_KEY` (real chain only)
- `CHAIN_ID` (real chain only)

Frontend (Vercel):
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_TX_EXPLORER_BASE_URL` (optional, explorer base for tx links)
