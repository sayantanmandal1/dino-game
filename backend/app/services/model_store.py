"""Versioned model persistence (filesystem + DB metadata)."""
from __future__ import annotations

import hashlib
import pickle
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from loguru import logger
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models_db import Model
from ..neat.inference import load_genome


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class ModelStore:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.models_dir: Path = self.settings.models_dir
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def path_for(self, model_id: str) -> Path:
        return self.models_dir / f"{model_id}.pkl"

    # ------------------------------------------------------------------
    async def save_genome(
        self,
        session: AsyncSession,
        genome: object,
        *,
        name: str,
        fitness: float,
        generations: int,
        notes: str = "",
    ) -> Model:
        model_id = str(uuid.uuid4())
        path = self.path_for(model_id)
        blob = pickle.dumps(genome)
        path.write_bytes(blob)

        num_nodes = len(getattr(genome, "nodes", {}) or {})
        num_conn = sum(1 for c in (getattr(genome, "connections", {}) or {}).values() if getattr(c, "enabled", True))

        row = Model(
            id=model_id,
            name=name,
            fitness=float(fitness),
            generations=int(generations),
            num_nodes=num_nodes,
            num_connections=num_conn,
            sha256=_sha256(blob),
            created_at=datetime.utcnow(),
            notes=notes,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        logger.info("Saved model {} ({})", name, model_id)
        return row

    async def save_uploaded(
        self,
        session: AsyncSession,
        *,
        name: str,
        raw_bytes: bytes,
        notes: str = "",
    ) -> Model:
        # Validate it unpickles + has expected attributes
        try:
            genome = pickle.loads(raw_bytes)
        except Exception as exc:
            raise ValueError(f"Invalid pickle: {exc}") from exc
        if not hasattr(genome, "nodes") or not hasattr(genome, "connections"):
            raise ValueError("Uploaded object is not a NEAT genome")
        model_id = str(uuid.uuid4())
        self.path_for(model_id).write_bytes(raw_bytes)

        num_nodes = len(genome.nodes)
        num_conn = sum(1 for c in genome.connections.values() if getattr(c, "enabled", True))
        row = Model(
            id=model_id,
            name=name,
            fitness=float(getattr(genome, "fitness", 0.0) or 0.0),
            generations=0,
            num_nodes=num_nodes,
            num_connections=num_conn,
            sha256=_sha256(raw_bytes),
            notes=notes,
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        return row

    # ------------------------------------------------------------------
    async def list_models(self, session: AsyncSession) -> list[Model]:
        res = await session.execute(select(Model).order_by(Model.created_at.desc()))
        return list(res.scalars().all())

    async def get(self, session: AsyncSession, model_id: str) -> Optional[Model]:
        res = await session.execute(select(Model).where(Model.id == model_id))
        return res.scalar_one_or_none()

    async def delete(self, session: AsyncSession, model_id: str) -> bool:
        row = await self.get(session, model_id)
        if not row:
            return False
        path = self.path_for(model_id)
        if path.exists():
            path.unlink()
        await session.execute(delete(Model).where(Model.id == model_id))
        await session.commit()
        return True

    def load_genome(self, model_id: str):
        return load_genome(self.path_for(model_id), self.settings.neat_config_path)


model_store = ModelStore()
