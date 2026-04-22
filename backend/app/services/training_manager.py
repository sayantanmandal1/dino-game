"""Singleton training manager with WebSocket broadcast fan-out."""
from __future__ import annotations

import asyncio
import json
import uuid
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Optional

from loguru import logger
from sqlalchemy import update

from ..config import get_settings
from ..db import AsyncSessionLocal
from ..models_db import TrainingRun
from ..neat.trainer import GenerationReport, NeatTrainer
from ..schemas import TrainingStartRequest, TrainingUpdate
from .model_store import model_store


class TrainingManager:
    """One active run at a time. Subscribers receive JSON events."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._task: Optional[asyncio.Task] = None
        self._trainer: Optional[NeatTrainer] = None
        self._run_id: Optional[str] = None
        self._subscribers: set[asyncio.Queue] = set()
        self._history: deque[dict] = deque(maxlen=100)
        self._current_report: Optional[GenerationReport] = None
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    @property
    def is_active(self) -> bool:
        return self._task is not None and not self._task.done()

    @property
    def run_id(self) -> Optional[str]:
        return self._run_id if self.is_active else None

    async def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=256)
        # replay history on connect
        for evt in self._history:
            await q.put(evt)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    async def _broadcast(self, update: TrainingUpdate) -> None:
        payload = json.loads(update.model_dump_json())
        self._history.append(payload)
        dead: list[asyncio.Queue] = []
        for q in list(self._subscribers):
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            self._subscribers.discard(q)

    # ------------------------------------------------------------------
    async def start(self, req: TrainingStartRequest) -> str:
        async with self._lock:
            if self.is_active:
                raise RuntimeError("A training run is already active")

            run_id = str(uuid.uuid4())
            self._run_id = run_id
            self._history.clear()

            async with AsyncSessionLocal() as session:
                row = TrainingRun(
                    id=run_id,
                    status="running",
                    population_size=req.population_size,
                    max_generations=req.max_generations,
                    best_fitness=0.0,
                    current_generation=0,
                    started_at=datetime.utcnow(),
                    config_json=req.model_dump_json(),
                )
                session.add(row)
                await session.commit()

            self._trainer = NeatTrainer(
                base_config_path=self.settings.neat_config_path,
                population_size=req.population_size,
                max_generations=req.max_generations,
                survival_threshold=req.survival_threshold,
                compatibility_threshold=req.compatibility_threshold,
                workers=self.settings.resolve_workers(),
            )

            await self._broadcast(
                TrainingUpdate(
                    run_id=run_id,
                    type="start",
                    population_size=req.population_size,
                    message=f"Starting {req.max_generations} generations",
                )
            )

            self._task = asyncio.create_task(self._run_loop(run_id, req))
            return run_id

    async def stop(self) -> bool:
        if not self.is_active or self._trainer is None:
            return False
        self._trainer.request_stop()
        return True

    # ------------------------------------------------------------------
    async def _run_loop(self, run_id: str, req: TrainingStartRequest) -> None:
        try:
            async def on_gen(report: GenerationReport) -> None:
                self._current_report = report
                async with AsyncSessionLocal() as session:
                    await session.execute(
                        update(TrainingRun)
                        .where(TrainingRun.id == run_id)
                        .values(
                            current_generation=report.generation,
                            best_fitness=report.best_fitness,
                        )
                    )
                    await session.commit()
                await self._broadcast(
                    TrainingUpdate(
                        run_id=run_id,
                        type="generation",
                        generation=report.generation,
                        best_fitness=report.best_fitness,
                        mean_fitness=report.mean_fitness,
                        species_count=report.species_count,
                        population_size=report.population_size,
                        elapsed_seconds=report.elapsed_seconds,
                    )
                )

            best_genome = await self._trainer.run(on_generation=on_gen)

            # Auto-save best model
            model_id = None
            if best_genome is not None:
                async with AsyncSessionLocal() as session:
                    name = req.run_name or f"NEAT-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
                    model_row = await model_store.save_genome(
                        session,
                        best_genome,
                        name=name,
                        fitness=float(best_genome.fitness or 0.0),
                        generations=self._current_report.generation if self._current_report else 0,
                    )
                    model_id = model_row.id

            async with AsyncSessionLocal() as session:
                await session.execute(
                    update(TrainingRun)
                    .where(TrainingRun.id == run_id)
                    .values(
                        status="finished" if not self._trainer._stop_flag else "stopped",
                        finished_at=datetime.utcnow(),
                        model_id=model_id,
                    )
                )
                await session.commit()

            await self._broadcast(
                TrainingUpdate(
                    run_id=run_id,
                    type="finished" if not self._trainer._stop_flag else "stopped",
                    generation=self._current_report.generation if self._current_report else 0,
                    best_fitness=self._current_report.best_fitness if self._current_report else 0.0,
                    model_id=model_id,
                    message=f"Training complete. Model id: {model_id}",
                )
            )

        except Exception as exc:  # pragma: no cover
            logger.exception("Training run failed")
            async with AsyncSessionLocal() as session:
                await session.execute(
                    update(TrainingRun)
                    .where(TrainingRun.id == run_id)
                    .values(status="error", finished_at=datetime.utcnow())
                )
                await session.commit()
            await self._broadcast(
                TrainingUpdate(run_id=run_id, type="error", message=str(exc))
            )
        finally:
            self._task = None
            self._trainer = None


training_manager = TrainingManager()
