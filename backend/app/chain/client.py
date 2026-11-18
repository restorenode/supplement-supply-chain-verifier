from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from web3 import Web3

from app.chain.networks import ResolvedNetwork, resolve_network
from app.core.config import settings

logger = logging.getLogger(__name__)


_MINIMAL_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "batchIdHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "attestationHash", "type": "bytes32"},
        ],
        "name": "publish",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "batchIdHash", "type": "bytes32"}],
        "name": "get",
        "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
        "stateMutability": "view",
        "type": "function",
    },
]


@dataclass
class ChainReceipt:
    tx_hash: str
    block_number: int
    status: int = 1


class ChainError(RuntimeError):
    """Raised when a registry call fails or a publish transaction does not succeed."""


class BatchHashRegistryClient:
    """Talks to a deployed BatchHashRegistry on the configured EVM network."""

    def __init__(self, network: Optional[ResolvedNetwork] = None) -> None:
        self.network = network or resolve_network()
        if not self.network.rpc_url or not settings.contract_address:
            raise RuntimeError("An RPC URL (CHAIN_NETWORK preset or CHAIN_RPC_URL) and CONTRACT_ADDRESS must be set")
        if not self.network.chain_id:
            raise RuntimeError("CHAIN_ID must be set for a custom CHAIN_NETWORK")

        self.w3 = Web3(Web3.HTTPProvider(self.network.rpc_url))
        self.contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.contract_address),
            abi=_MINIMAL_ABI,
        )
        self.chain_id = self.network.chain_id
        self._account = None

    @property
    def publisher_address(self) -> str:
        account = self._get_account()
        return account.address

    def _get_account(self):
        if self._account is None:
            if not settings.publisher_private_key:
                raise RuntimeError("PUBLISHER_PRIVATE_KEY must be set")
            self._account = self.w3.eth.account.from_key(settings.publisher_private_key)
        return self._account

    def publish(self, batch_id_hash: bytes, attestation_hash: bytes) -> str:
        account = self._get_account()
        params = {
            "from": account.address,
            "nonce": self.w3.eth.get_transaction_count(account.address),
            "chainId": self.chain_id,
        }
        if self.network.legacy_tx:
            # e.g. Initia MiniEVM: no EIP-1559 support.
            params["gasPrice"] = self.w3.eth.gas_price
        # Otherwise web3 fills EIP-1559 fees (maxFeePerGas / maxPriorityFeePerGas).
        tx = self.contract.functions.publish(batch_id_hash, attestation_hash).build_transaction(params)
        tx.setdefault("gas", self.w3.eth.estimate_gas(tx))
        signed = self.w3.eth.account.sign_transaction(tx, account.key)
        raw_tx = getattr(signed, "rawTransaction", None) or signed.raw_transaction
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        return self.w3.to_hex(tx_hash)

    def get_receipt(self, tx_hash: str) -> ChainReceipt:
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        return ChainReceipt(
            tx_hash=self.w3.to_hex(receipt["transactionHash"]),
            block_number=receipt["blockNumber"],
            status=receipt.get("status", 1),
        )

    def get(self, batch_id_hash: bytes) -> Optional[bytes]:
        result = self.contract.functions.get(batch_id_hash).call()
        if result == b"\x00" * 32:
            return None
        return result


class MockBatchHashRegistryClient:
    """Stand-in for BatchHashRegistry that mirrors the contract's rules.

    Receipts carry realistic block numbers for the selected network. With a state_path the
    sealed records survive restarts; without one they live in memory (used by tests).
    """

    def __init__(self, network: Optional[ResolvedNetwork] = None, state_path: Optional[str] = None) -> None:
        self.network = network or resolve_network()
        self._path = Path(state_path) if state_path else None
        self._lock = threading.Lock()
        self._store: dict[bytes, bytes] = {}
        self._receipts: dict[str, ChainReceipt] = {}
        self._tx_by_batch: dict[bytes, str] = {}
        self._next_block = self.network.mock_start_block
        self._load()

    @property
    def publisher_address(self) -> str:
        return "0x0000000000000000000000000000000000000000"

    def publish(self, batch_id_hash: bytes, attestation_hash: bytes) -> str:
        if batch_id_hash == b"\x00" * 32:
            raise ChainError("BATCH_ID_REQUIRED")
        if attestation_hash == b"\x00" * 32:
            raise ChainError("ATTESTATION_REQUIRED")
        with self._lock:
            if batch_id_hash in self._store:
                raise ChainError("ALREADY_PUBLISHED")  # same rule as the contract
            tx_hash = Web3.to_hex(
                Web3.keccak(text=f"{self.network.key}:{batch_id_hash.hex()}:{attestation_hash.hex()}:{time.time_ns()}")
            )
            # Advance a plausible number of blocks between seals.
            self._next_block += 1 + int(tx_hash[2:6], 16) % 40
            self._store[batch_id_hash] = attestation_hash
            self._receipts[tx_hash] = ChainReceipt(tx_hash=tx_hash, block_number=self._next_block)
            self._tx_by_batch[batch_id_hash] = tx_hash
            self._save()
        return tx_hash

    def get_receipt(self, tx_hash: str) -> ChainReceipt:
        return self._receipts.get(tx_hash, ChainReceipt(tx_hash=tx_hash, block_number=self._next_block))

    def get(self, batch_id_hash: bytes) -> Optional[bytes]:
        return self._store.get(batch_id_hash)

    # --- persistence -------------------------------------------------------------------

    def _load(self) -> None:
        if not self._path or not self._path.exists():
            return
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            if data.get("network") != self.network.key:
                logger.info("Mock chain state is for %s; starting a fresh %s registry", data.get("network"), self.network.key)
                return
            for batch_hex, record in data.get("records", {}).items():
                batch = bytes.fromhex(batch_hex)
                self._store[batch] = bytes.fromhex(record["attestation"])
                self._tx_by_batch[batch] = record["tx"]
                self._receipts[record["tx"]] = ChainReceipt(tx_hash=record["tx"], block_number=record["block"])
            self._next_block = max(self._next_block, int(data.get("lastBlock", 0)))
        except (OSError, ValueError, KeyError) as exc:
            logger.warning("Ignoring unreadable mock chain state at %s: %s", self._path, exc)

    def _save(self) -> None:
        if not self._path:
            return
        records = {
            batch.hex(): {
                "attestation": attestation.hex(),
                "tx": self._tx_by_batch[batch],
                "block": self._receipts[self._tx_by_batch[batch]].block_number,
            }
            for batch, attestation in self._store.items()
        }
        payload = {"network": self.network.key, "lastBlock": self._next_block, "records": records}
        tmp = self._path.with_suffix(self._path.suffix + ".tmp")
        tmp.write_text(json.dumps(payload, indent=1), encoding="utf-8")
        os.replace(tmp, self._path)
