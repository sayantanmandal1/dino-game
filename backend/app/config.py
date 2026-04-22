"""Application configuration via environment variables."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Package root: .../backend/app
_PKG_ROOT = Path(__file__).resolve().parent


def _default_data_dir() -> Path:
    # Prefer /app/data in containers; otherwise ./data relative to CWD.
    if Path("/app").exists():
        return Path("/app/data")
    return Path.cwd() / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Dino AI Trainer"
    environment: str = Field(default="development")

    data_dir: Path = Field(default_factory=_default_data_dir)
    models_dirname: str = "models"
    database_url: str = Field(default="")  # resolved post-init if empty

    allowed_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost",
            "http://127.0.0.1",
            "http://127.0.0.1:3000",
        ]
    )

    neat_workers: str = Field(default="auto")  # "auto" | "1" | "N"
    neat_config_path: Path = Field(default_factory=lambda: _PKG_ROOT / "neat" / "config.ini")

    max_upload_bytes: int = 5 * 1024 * 1024  # 5 MB

    @property
    def models_dir(self) -> Path:
        return self.data_dir / self.models_dirname

    def resolve_workers(self) -> int:
        if self.neat_workers == "auto":
            return max(1, (os.cpu_count() or 2) - 1)
        try:
            return max(1, int(self.neat_workers))
        except ValueError:
            return 1


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    # Default DATABASE_URL to {data_dir}/dino.db if not provided
    if not s.database_url:
        db_path = (s.data_dir / "dino.db").as_posix()
        s.database_url = f"sqlite+aiosqlite:///{db_path}"
    s.data_dir.mkdir(parents=True, exist_ok=True)
    s.models_dir.mkdir(parents=True, exist_ok=True)
    return s
