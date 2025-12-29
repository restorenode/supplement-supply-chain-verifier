# BatchHashRegistry (Foundry)

## Setup

```bash
cd contracts
cp .env.example .env
```

Fill in `RPC_URL` and `PRIVATE_KEY` in `.env`.

## Run tests

```bash
forge test
```

## Deploy to Initia EVM (legacy transactions)

Initia MiniEVM does not support EIP-1559, so deployments must use legacy transactions.

```bash
forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy \
  -vvvv
```

## Verify by calling get()

```bash
BATCH_ID_HASH=$(cast keccak "VA-2025-0001")
cast call <DEPLOYED_CONTRACT_ADDRESS> "get(bytes32)" $BATCH_ID_HASH --rpc-url $RPC_URL
```

## Deployed addresses

- Initia EVM (chain 2124225178762456): `0x786d4EbA72BA8145629288817ee446666f4C37fd`
