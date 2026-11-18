"""Known EVM networks for the BatchHashRegistry.

Pick one with CHAIN_NETWORK. Each preset supplies the chain ID, a public RPC, the block
explorer and the transaction type, so switching networks is a one-line change. Explicit
CHAIN_RPC_URL / CHAIN_ID / CHAIN_EXPLORER_URL values still override the preset.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Network:
    key: str
    display_name: str
    chain_id: int
    rpc_url: str
    explorer_url: Optional[str]
    # Initia MiniEVM rejects EIP-1559 transactions; everything else here supports them.
    legacy_tx: bool = False
    # Realistic starting block for the mock registry, so mock receipts look like the real chain.
    mock_start_block: int = 1
    testnet: bool = False


NETWORKS: dict[str, Network] = {
    n.key: n
    for n in (
        Network("base", "Base", 8453, "https://mainnet.base.org", "https://basescan.org", mock_start_block=22_400_000),
        Network(
            "base-sepolia",
            "Base Sepolia",
            84532,
            "https://sepolia.base.org",
            "https://sepolia.basescan.org",
            mock_start_block=18_440_000,
            testnet=True,
        ),
        Network("ethereum", "Ethereum", 1, "https://ethereum-rpc.publicnode.com", "https://etherscan.io", mock_start_block=21_200_000),
        Network(
            "sepolia",
            "Sepolia",
            11155111,
            "https://ethereum-sepolia-rpc.publicnode.com",
            "https://sepolia.etherscan.io",
            mock_start_block=7_100_000,
            testnet=True,
        ),
        Network(
            "initia-evm",
            "Initia EVM",
            2124225178762456,
            "https://jsonrpc-evm-1.anvil.asia-southeast.initia.xyz",
            None,
            legacy_tx=True,
            mock_start_block=4_200_000,
            testnet=True,
        ),
    )
}

DEFAULT_NETWORK = "base-sepolia"


@dataclass(frozen=True)
class ResolvedNetwork:
    key: str
    display_name: str
    chain_id: int
    rpc_url: str
    explorer_url: Optional[str]
    legacy_tx: bool
    mock_start_block: int
    testnet: bool


def resolve_network() -> ResolvedNetwork:
    """The active network: the CHAIN_NETWORK preset, with any explicit env overrides applied."""
    key = (settings.chain_network or DEFAULT_NETWORK).strip().lower()
    preset = NETWORKS.get(key)
    if preset is None:
        # Custom network: everything must come from env.
        return ResolvedNetwork(
            key=key,
            display_name=key.replace("-", " ").title(),
            chain_id=settings.chain_id,
            rpc_url=settings.chain_rpc_url,
            explorer_url=settings.chain_explorer_url.rstrip("/") or None,
            legacy_tx=settings.chain_legacy_tx,
            mock_start_block=1,
            testnet=False,
        )

    if settings.chain_id and settings.chain_id != preset.chain_id:
        logger.warning(
            "CHAIN_ID=%s overrides the %s preset (chain %s). Check CHAIN_NETWORK.",
            settings.chain_id,
            preset.key,
            preset.chain_id,
        )
    return ResolvedNetwork(
        key=preset.key,
        display_name=preset.display_name,
        chain_id=settings.chain_id or preset.chain_id,
        rpc_url=settings.chain_rpc_url or preset.rpc_url,
        explorer_url=(settings.chain_explorer_url.rstrip("/") or preset.explorer_url),
        legacy_tx=settings.chain_legacy_tx or preset.legacy_tx,
        mock_start_block=preset.mock_start_block,
        testnet=preset.testnet,
    )
