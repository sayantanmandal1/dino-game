"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TrainingStartRequest(BaseModel):
    population_size: int = Field(default=50, ge=4, le=500)
    max_generations: int = Field(default=30, ge=1, le=500)
    mutation_rate: float = Field(default=0.8, ge=0.0, le=1.0)
    survival_threshold: float = Field(default=0.2, ge=0.05, le=0.9)
    compatibility_threshold: float = Field(default=3.0, ge=0.5, le=10.0)
    seed: Optional[int] = Field(default=None)
    run_name: Optional[str] = Field(default=None, max_length=120)


class TrainingStartResponse(BaseModel):
    run_id: str
    status: str


class TrainingUpdate(BaseModel):
    run_id: str
    type: Literal["generation", "finished", "stopped", "error", "start"]
    generation: int = 0
    best_fitness: float = 0.0
    mean_fitness: float = 0.0
    species_count: int = 0
    population_size: int = 0
    elapsed_seconds: float = 0.0
    best_genome_id: Optional[str] = None
    model_id: Optional[str] = None
    message: Optional[str] = None


class DecisionRequest(BaseModel):
    model_id: str
    sensors: list[float]


class DecisionResponse(BaseModel):
    action: Literal["jump", "duck", "noop"]
    outputs: list[float]


class ModelInfo(BaseModel):
    id: str
    name: str
    fitness: float
    generations: int
    num_nodes: int
    num_connections: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ModelUpdateRequest(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None


class GenomeGraph(BaseModel):
    nodes: list[dict]
    connections: list[dict]


class LeaderboardSubmitRequest(BaseModel):
    player_name: str = Field(min_length=1, max_length=32)
    score: int = Field(ge=0)
    mode: Literal["human", "ai"] = "human"
    model_id: Optional[str] = None


class LeaderboardEntryOut(BaseModel):
    id: int
    player_name: str
    score: int
    mode: str
    model_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TrainingStatusResponse(BaseModel):
    active: bool
    run_id: Optional[str] = None
    generation: int = 0
    best_fitness: float = 0.0
