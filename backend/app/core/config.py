from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGIN_REGEX = r"https://.*\.vercel\.app|http://(localhost|127\.0\.0\.1)(:\d+)?"


class Settings(BaseSettings):
    database_url: str = "sqlite:///./app.db"
    admin_api_key: str = ""
    env: str = "dev"
    chain_rpc_url: str = ""
    contract_address: str = ""
    publisher_private_key: str = ""
    chain_id: int = 0
    chain_name: str = "initia-evm"
    chain_mode: str = "real"
    llm_provider: str = "mock"
    llm_base_url: str = ""
    llm_api_key: str = ""
    llm_model: str = ""
    cors_origin_regex: str = DEFAULT_CORS_ORIGIN_REGEX
    max_upload_bytes: int = 20 * 1024 * 1024

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", case_sensitive=False)


settings = Settings()
