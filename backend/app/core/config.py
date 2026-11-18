from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGIN_REGEX = r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?"


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    admin_api_key: str = ""
    env: str = "dev"
    # Network preset (see app/chain/networks.py). CHAIN_NAME is accepted for older configs.
    chain_network: str = Field(default="base-sepolia", validation_alias=AliasChoices("chain_network", "chain_name"))
    # Optional overrides of the preset's values.
    chain_rpc_url: str = ""
    chain_id: int = 0
    chain_explorer_url: str = ""
    chain_legacy_tx: bool = False
    contract_address: str = ""
    publisher_private_key: str = ""
    chain_mode: str = "real"
    # Where the mock registry persists sealed records between restarts ("" = in memory only).
    mock_chain_path: str = "mock_chain.json"
    llm_provider: str = "mock"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    cors_origin_regex: str = DEFAULT_CORS_ORIGIN_REGEX
    max_upload_bytes: int = 20 * 1024 * 1024

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False)


settings = Settings()
