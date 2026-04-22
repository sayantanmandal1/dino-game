"""Leaderboard endpoints."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..models_db import LeaderboardEntry
from ..schemas import LeaderboardEntryOut, LeaderboardSubmitRequest

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


@router.post("", response_model=LeaderboardEntryOut)
async def submit(
    req: LeaderboardSubmitRequest, session: AsyncSession = Depends(get_session)
) -> LeaderboardEntryOut:
    row = LeaderboardEntry(
        player_name=req.player_name,
        score=req.score,
        mode=req.mode,
        model_id=req.model_id,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return LeaderboardEntryOut.model_validate(row)


@router.get("", response_model=List[LeaderboardEntryOut])
async def top(
    mode: Optional[str] = Query(default=None, pattern="^(human|ai)$"),
    limit: int = Query(default=25, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> List[LeaderboardEntryOut]:
    stmt = select(LeaderboardEntry).order_by(desc(LeaderboardEntry.score), LeaderboardEntry.created_at)
    if mode:
        stmt = stmt.where(LeaderboardEntry.mode == mode)
    stmt = stmt.limit(limit)
    res = await session.execute(stmt)
    rows = list(res.scalars().all())
    return [LeaderboardEntryOut.model_validate(r) for r in rows]
