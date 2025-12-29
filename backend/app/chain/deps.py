from functools import lru_cache

from app.chain.client import BatchHashRegistryClient, MockBatchHashRegistryClient
from app.core.config import settings


@lru_cache(maxsize=1)
def get_chain_client() -> BatchHashRegistryClient:
    if settings.chain_mode.lower() == "mock":
        return MockBatchHashRegistryClient()
    return BatchHashRegistryClient()
