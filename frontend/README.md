# Supplement Supply Chain Verification Protocol (Frontend)

## Install

```bash
npm install
```

## Configure API base URL

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to the backend URL. Network names and
block-explorer links come from the backend (`GET /chain/info`), so no chain settings are needed here.

```bash
cp .env.example .env.local
```

## Run dev server

```bash
npm run dev
```

## Run tests

```bash
npm test
```
