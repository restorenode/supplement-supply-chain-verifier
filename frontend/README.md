# Supplement Supply Chain Verification Protocol (Frontend)

## Install

```bash
npm install
```

## Configure API base URL

Copy `.env.example` to `.env.local` and update `NEXT_PUBLIC_API_BASE_URL` (and optional tx explorer base).

```bash
cp .env.example .env.local
```

Optional env:
- `NEXT_PUBLIC_TX_EXPLORER_BASE_URL` (used to link transaction hashes)

## Run dev server

```bash
npm run dev
```

## Run tests

```bash
npm test
```
