from __future__ import annotations

from dataclasses import dataclass
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
        if not settings.publisher_private_key:
            raise RuntimeError("PUBLISHER_PRIVATE_KEY must be set")
        if not settings.chain_id:
            raise RuntimeError("CHAIN_ID must be set")

        self.w3 = Web3(Web3.HTTPProvider(settings.chain_rpc_url))
        self.contract = self.w3.eth.contract(
            address=self.w3.to_checksum_address(settings.contract_address),
            abi=_MINIMAL_ABI,
        )
        self.account = self.w3.eth.account.from_key(settings.publisher_private_key)
        self.chain_id = settings.chain_id

    @property
    def publisher_address(self) -> str:
        return self.account.address

    def publish(self, batch_id_hash: bytes, attestation_hash: bytes) -> str:
        nonce = self.w3.eth.get_transaction_count(self.account.address)
        gas_price = self.w3.eth.gas_price
        tx = self.contract.functions.publish(batch_id_hash, attestation_hash).build_transaction(
            {
                "from": self.account.address,
                "nonce": nonce,
                "gasPrice": gas_price,
                "chainId": self.chain_id,
            }
        )
        tx.setdefault("gas", self.w3.eth.estimate_gas(tx))
        signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
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
