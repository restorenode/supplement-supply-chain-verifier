from functools import lru_cache

from app.chain.client import BatchHashRegistryClient


@lru_cache(maxsize=1)
def get_chain_client() -> BatchHashRegistryClient:
    return BatchHashRegistryClient()
