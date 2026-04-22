"""Database ORM models."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Model(Base):
    __tablename__ = "models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    fitness: Mapped[float] = mapped_column(Float, default=0.0)
    generations: Mapped[int] = mapped_column(Integer, default=0)
    num_nodes: Mapped[int] = mapped_column(Integer, default=0)
    num_connections: Mapped[int] = mapped_column(Integer, default=0)
    sha256: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[str] = mapped_column(Text, default="")


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), default="running")  # running|finished|stopped|error
    population_size: Mapped[int] = mapped_column(Integer, default=0)
    max_generations: Mapped[int] = mapped_column(Integer, default=0)
    best_fitness: Mapped[float] = mapped_column(Float, default=0.0)
    current_generation: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    model_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    config_json: Mapped[str] = mapped_column(Text, default="{}")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    player_name: Mapped[str] = mapped_column(String(32), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    mode: Mapped[str] = mapped_column(String(8), default="human")  # human|ai
    model_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
