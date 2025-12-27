"""Configuration management."""

import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Application configuration."""

    # API Configuration
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    anthropic_model: str = Field(
        default="claude-sonnet-4-5-20250929",
        alias="ANTHROPIC_MODEL"
    )

    # Paths
    data_dir: Path = Field(
        default=Path("C:/Users/lyyud/projects/health"),
        alias="DATA_DIR"
    )
    raw_data_dir: Path = Field(
        default=Path("C:/Users/lyyud/projects/health/MedicalRecord_ZacharyWendland"),
        alias="RAW_DATA_DIR"
    )
    knowledge_base_dir: Path = Field(
        default=Path("C:/Users/lyyud/projects/health/data/knowledge_base"),
        alias="KNOWLEDGE_BASE_DIR"
    )
    logs_dir: Path = Field(
        default=Path("C:/Users/lyyud/projects/health/data/logs"),
        alias="LOGS_DIR"
    )

    # Processing Configuration
    enable_ultrathink: bool = Field(default=True, alias="ENABLE_ULTRATHINK")
    batch_size: int = Field(default=10, alias="BATCH_SIZE")
    max_workers: int = Field(default=4, alias="MAX_WORKERS")

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        alias="LOG_FORMAT"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    def ensure_directories(self) -> None:
        """Ensure all configured directories exist."""
        self.knowledge_base_dir.mkdir(parents=True, exist_ok=True)
        (self.knowledge_base_dir / "history").mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)


def get_config() -> Config:
    """
    Get application configuration.

    Returns:
        Config object
    """
    return Config()
