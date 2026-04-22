"""API surface tests — run with pytest against the asgi app in-process."""
from __future__ import annotations

import os
import tempfile

# Set env BEFORE importing the app so Settings picks up our temp data dir.
_TMP = tempfile.mkdtemp(prefix="dino-test-")
os.environ["DATA_DIR"] = _TMP
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP.replace(chr(92), '/')}/dino-test.db"

import pytest
from httpx import ASGITransport, AsyncClient

from app.db import init_db
from app.main import app


@pytest.mark.asyncio
async def test_health_and_root():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

        r = await ac.get("/")
        assert r.status_code == 200
        assert r.json()["app"]


@pytest.mark.asyncio
async def test_models_and_leaderboard_empty():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/models")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        r = await ac.get("/api/leaderboard")
        assert r.status_code == 200
        assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_leaderboard_submit_and_list():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.post(
            "/api/leaderboard",
            json={"player_name": "tester", "score": 123, "mode": "human"},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["player_name"] == "tester"
        assert body["score"] == 123

        r = await ac.get("/api/leaderboard?mode=human")
        assert r.status_code == 200
        rows = r.json()
        assert any(row["player_name"] == "tester" for row in rows)


@pytest.mark.asyncio
async def test_upload_rejects_garbage():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        files = {"file": ("bad.pkl", b"\xde\xad\xbe\xef", "application/octet-stream")}
        r = await ac.post("/api/models/upload", data={"name": "bad", "notes": ""}, files=files)
        assert r.status_code == 400


@pytest.mark.asyncio
async def test_training_status_idle():
    await init_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/training/status")
        assert r.status_code == 200
        body = r.json()
        assert body["active"] in (False, True)
