from __future__ import annotations

from dataclasses import dataclass
import time
from typing import Optional

from web3 import Web3

from app.core.config import settings


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


class BatchHashRegistryClient:
    def __init__(self) -> None:
        if not settings.chain_rpc_url or not settings.contract_address:
            raise RuntimeError("CHAIN_RPC_URL and CONTRACT_ADDRESS must be set")
        if not settings.chain_id:
            raise RuntimeError("CHAIN_ID must be set")

        self.w3 = Web3(Web3.HTTPProvider(settings.chain_rpc_url))
        self.contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.contract_address),
            abi=_MINIMAL_ABI,
        )
        self.chain_id = settings.chain_id
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
        nonce = self.w3.eth.get_transaction_count(account.address)
        gas_price = self.w3.eth.gas_price
        tx = self.contract.functions.publish(batch_id_hash, attestation_hash).build_transaction(
            {
                "from": account.address,
                "nonce": nonce,
                "gasPrice": gas_price,
                "chainId": self.chain_id,
            }
        )
        tx.setdefault("gas", self.w3.eth.estimate_gas(tx))
        signed = self.w3.eth.account.sign_transaction(tx, account.key)
        raw_tx = getattr(signed, "rawTransaction", None) or signed.raw_transaction
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        return self.w3.to_hex(tx_hash)

    def get_receipt(self, tx_hash: str) -> ChainReceipt:
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return ChainReceipt(tx_hash=self.w3.to_hex(receipt["transactionHash"]), block_number=receipt["blockNumber"])

    def get(self, batch_id_hash: bytes) -> Optional[bytes]:
        result = self.contract.functions.get(batch_id_hash).call()
        if result == b"\x00" * 32:
            return None
        return result


class MockBatchHashRegistryClient:
    def __init__(self) -> None:
        self._store: dict[bytes, bytes] = {}
        self._receipts: dict[str, ChainReceipt] = {}

    @property
    def publisher_address(self) -> str:
        return "0x0000000000000000000000000000000000000000"

    def publish(self, batch_id_hash: bytes, attestation_hash: bytes) -> str:
        if batch_id_hash == b"\x00" * 32 or attestation_hash == b"\x00" * 32:
            raise RuntimeError("Invalid hash values")
        if batch_id_hash in self._store:
            raise RuntimeError("ALREADY_PUBLISHED")
        self._store[batch_id_hash] = attestation_hash
        tx_hash = Web3.to_hex(Web3.keccak(text=f"{batch_id_hash.hex()}:{attestation_hash.hex()}:{time.time()}"))
        self._receipts[tx_hash] = ChainReceipt(tx_hash=tx_hash, block_number=1)
        return tx_hash

    def get_receipt(self, tx_hash: str) -> ChainReceipt:
        return self._receipts.get(tx_hash, ChainReceipt(tx_hash=tx_hash, block_number=1))

    def get(self, batch_id_hash: bytes) -> Optional[bytes]:
        return self._store.get(batch_id_hash)
