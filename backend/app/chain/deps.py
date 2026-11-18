from functools import lru_cache

from app.chain.client import BatchHashRegistryClient, MockBatchHashRegistryClient
from app.core.config import settings


@lru_cache(maxsize=1)
def get_chain_client() -> BatchHashRegistryClient | MockBatchHashRegistryClient:
    if settings.chain_mode.lower() == "mock":
        return MockBatchHashRegistryClient(state_path=settings.mock_chain_path or None)
    return BatchHashRegistryClient()
