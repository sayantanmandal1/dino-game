"""Training control + live-update WebSocket."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from loguru import logger

from ..schemas import (
    TrainingStartRequest,
    TrainingStartResponse,
    TrainingStatusResponse,
)
from ..services.training_manager import training_manager

router = APIRouter(prefix="/api/training", tags=["training"])


@router.post("/start", response_model=TrainingStartResponse)
async def start_training(req: TrainingStartRequest) -> TrainingStartResponse:
    try:
        run_id = await training_manager.start(req)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return TrainingStartResponse(run_id=run_id, status="running")


@router.post("/stop")
async def stop_training() -> dict:
    ok = await training_manager.stop()
    if not ok:
        raise HTTPException(status_code=400, detail="No active training run")
    return {"status": "stopping"}


@router.get("/status", response_model=TrainingStatusResponse)
async def training_status() -> TrainingStatusResponse:
    r = training_manager._current_report
    return TrainingStatusResponse(
        active=training_manager.is_active,
        run_id=training_manager.run_id,
        generation=r.generation if r else 0,
        best_fitness=r.best_fitness if r else 0.0,
    )


# ----------------------------------------------------------------------


@router.websocket("/ws/training")
async def training_ws(ws: WebSocket) -> None:
    await ws.accept()
    queue = await training_manager.subscribe()
    try:
        while True:
            try:
                evt = await asyncio.wait_for(queue.get(), timeout=25.0)
                await ws.send_json(evt)
            except asyncio.TimeoutError:
                # Send keepalive ping
                await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        logger.debug("training ws disconnected")
    except Exception as exc:  # pragma: no cover
        logger.exception("training ws error: {}", exc)
    finally:
        training_manager.unsubscribe(queue)
