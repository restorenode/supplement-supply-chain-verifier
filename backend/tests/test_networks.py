import pytest

from app.chain.client import ChainError, MockBatchHashRegistryClient
from app.chain.hashing import hash_batch_id
from app.chain.networks import NETWORKS, ResolvedNetwork, resolve_network
from app.core import config

CHAIN_FIELDS = ("chain_network", "chain_id", "chain_rpc_url", "chain_explorer_url", "chain_legacy_tx")


@pytest.fixture()
def chain_settings():
    original = {field: getattr(config.settings, field) for field in CHAIN_FIELDS}
    config.settings.chain_id = 0
    config.settings.chain_rpc_url = ""
    config.settings.chain_explorer_url = ""
    config.settings.chain_legacy_tx = False
    yield config.settings
    for field, value in original.items():
        setattr(config.settings, field, value)


def _resolved(key: str) -> ResolvedNetwork:
    n = NETWORKS[key]
    return ResolvedNetwork(n.key, n.display_name, n.chain_id, n.rpc_url, n.explorer_url, n.legacy_tx, n.mock_start_block, n.testnet)


def test_presets_resolve_with_overrides(chain_settings):
    chain_settings.chain_network = "base"
    base = resolve_network()
    assert (base.chain_id, base.rpc_url, base.explorer_url, base.legacy_tx) == (
        8453,
        "https://mainnet.base.org",
        "https://basescan.org",
        False,
    )

    chain_settings.chain_rpc_url = "https://my-node.example"
    assert resolve_network().rpc_url == "https://my-node.example"

    chain_settings.chain_network = "initia-evm"
    chain_settings.chain_rpc_url = ""
    assert resolve_network().legacy_tx is True


def test_unknown_network_uses_env_values(chain_settings):
    chain_settings.chain_network = "my-l2"
    chain_settings.chain_id = 999
    chain_settings.chain_rpc_url = "https://rpc.my-l2.example"
    chain_settings.chain_explorer_url = "https://scan.my-l2.example/"
    net = resolve_network()
    assert (net.key, net.display_name, net.chain_id, net.explorer_url) == ("my-l2", "My L2", 999, "https://scan.my-l2.example")


def test_mock_registry_mirrors_contract_and_persists(tmp_path):
    path = tmp_path / "mock_chain.json"
    sepolia = _resolved("base-sepolia")
    chain = MockBatchHashRegistryClient(network=sepolia, state_path=str(path))
    batch, attestation = hash_batch_id("TEST-1"), b"\x01" * 32

    tx = chain.publish(batch, attestation)
    receipt = chain.get_receipt(tx)
    assert receipt.block_number > sepolia.mock_start_block

    with pytest.raises(ChainError, match="ALREADY_PUBLISHED"):
        chain.publish(batch, attestation)

    reloaded = MockBatchHashRegistryClient(network=sepolia, state_path=str(path))
    assert reloaded.get(batch) == attestation
    assert reloaded.get_receipt(tx).block_number == receipt.block_number

    # State recorded for another network is not reused.
    assert MockBatchHashRegistryClient(network=_resolved("base"), state_path=str(path)).get(batch) is None
