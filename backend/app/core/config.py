from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Sales Copilot API"
    app_env: str = "dev"
    database_url: str = "sqlite:///./copilot.db"
    api_prefix: str = "/api/v1"
    tavily_api_key: str | None = None
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    llm_provider_order: str = "GEMINI,OPENAI"
    radar_source_allowlist: str = (
        "reuters.com,bloomberg.com,businesswire.com,prnewswire.com,globenewswire.com,"
        "digitimes.com,digitimes.com.tw,cnyes.com,moneydj.com,ctee.com.tw,technews.tw,"
        "udn.com,money.udn.com,eettaiwan.com,36kr.com,nikkei.com,wsj.com,ft.com,yahoo.com,"
        "investing.com,seekingalpha.com,techcrunch.com,theverge.com,linkedin.com,104.com.tw,jobs.104.com.tw"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
