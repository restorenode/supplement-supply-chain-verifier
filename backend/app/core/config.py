from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    admin_api_key: str = ""
    env: str = "dev"
    chain_rpc_url: str = ""
    contract_address: str = ""
    publisher_private_key: str = ""
    chain_id: int = 0
    chain_name: str = "initia-evm"
    llm_provider: str = "mock"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False)


settings = Settings()
