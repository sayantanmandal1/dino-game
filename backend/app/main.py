"""FastAPI application entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from .config import get_settings
from .db import init_db
from .routers import health, inference, leaderboard, models, training


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await init_db()
    logger.info(
        "🦖 Dino AI Trainer backend ready | data_dir={} | workers={}",
        settings.data_dir,
        settings.resolve_workers(),
    )
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(training.router)
app.include_router(inference.router)
app.include_router(models.router)
app.include_router(leaderboard.router)


@app.get("/")
async def root() -> dict:
    return {
        "app": settings.app_name,
        "version": "1.0.0",
        "docs": "/docs",
    }
