"""Model CRUD + genome graph endpoints."""
from __future__ import annotations

import io
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db import get_session
from ..neat.inference import genome_to_graph
from ..schemas import GenomeGraph, ModelInfo, ModelUpdateRequest
from ..services.model_store import model_store
from . import inference as inference_router

router = APIRouter(prefix="/api/models", tags=["models"])


@router.get("", response_model=List[ModelInfo])
async def list_models(session: AsyncSession = Depends(get_session)) -> List[ModelInfo]:
    rows = await model_store.list_models(session)
    return [ModelInfo.model_validate(r) for r in rows]


@router.get("/{model_id}", response_model=ModelInfo)
async def get_model(model_id: str, session: AsyncSession = Depends(get_session)) -> ModelInfo:
    row = await model_store.get(session, model_id)
    if not row:
        raise HTTPException(status_code=404, detail="Model not found")
    return ModelInfo.model_validate(row)


@router.delete("/{model_id}")
async def delete_model(model_id: str, session: AsyncSession = Depends(get_session)) -> dict:
    ok = await model_store.delete(session, model_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Model not found")
    inference_router.net_cache.pop(model_id, None)
    return {"status": "deleted"}


@router.patch("/{model_id}", response_model=ModelInfo)
async def update_model(
    model_id: str,
    patch: ModelUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> ModelInfo:
    row = await model_store.get(session, model_id)
    if not row:
        raise HTTPException(status_code=404, detail="Model not found")
    if patch.name is not None:
        row.name = patch.name
    if patch.notes is not None:
        row.notes = patch.notes
    await session.commit()
    await session.refresh(row)
    return ModelInfo.model_validate(row)


@router.get("/{model_id}/download")
async def download_model(model_id: str, session: AsyncSession = Depends(get_session)):
    row = await model_store.get(session, model_id)
    if not row:
        raise HTTPException(status_code=404, detail="Model not found")
    path = model_store.path_for(model_id)
    if not path.exists():
        raise HTTPException(status_code=410, detail="Model file missing")
    data = path.read_bytes()
    safe_name = "".join(c for c in row.name if c.isalnum() or c in "._- ") or "model"
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.pkl"'},
    )


@router.get("/{model_id}/graph", response_model=GenomeGraph)
async def model_graph(model_id: str, session: AsyncSession = Depends(get_session)) -> GenomeGraph:
    row = await model_store.get(session, model_id)
    if not row:
        raise HTTPException(status_code=404, detail="Model not found")
    try:
        genome, config = model_store.load_genome(model_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=410, detail="Model file missing") from exc
    return GenomeGraph(**genome_to_graph(genome, config))


@router.post("/upload", response_model=ModelInfo)
async def upload_model(
    name: str = Form(...),
    file: UploadFile = File(...),
    notes: str = Form(""),
    session: AsyncSession = Depends(get_session),
) -> ModelInfo:
    settings = get_settings()
    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail="File too large")
    try:
        row = await model_store.save_uploaded(session, name=name, raw_bytes=data, notes=notes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ModelInfo.model_validate(row)
