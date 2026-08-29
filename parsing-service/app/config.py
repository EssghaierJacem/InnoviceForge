from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672

    minio_url: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "invoices"

    gemini_api_key: str
    gemini_model: str = "gemini-3.5-flash-lite"

    confidence_threshold: float = 0.6


@lru_cache
def get_settings() -> Settings:
    return Settings()
