"""AI inference: REST single-shot decide + WebSocket autopilot stream."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from loguru import logger

from ..neat.inference import build_net, decide
from ..schemas import DecisionRequest, DecisionResponse
from ..services.model_store import model_store

router = APIRouter(prefix="/api", tags=["inference"])

# Net cache keyed by model_id. Public so the models router can invalidate it on delete.
net_cache: dict[str, object] = {}


def _load_net(model_id: str):
    if model_id in net_cache:
        return net_cache[model_id]
    try:
        genome, config = model_store.load_genome(model_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Model file missing") from exc
    net = build_net(genome, config)
    net_cache[model_id] = net
    return net


@router.post("/decision", response_model=DecisionResponse)
async def decision(req: DecisionRequest) -> DecisionResponse:
    net = _load_net(req.model_id)
    action, outputs = decide(net, req.sensors)
    return DecisionResponse(action=action, outputs=outputs)


@router.websocket("/ws/play/{model_id}")
async def play_ws(ws: WebSocket, model_id: str) -> None:
    await ws.accept()
    try:
        net = _load_net(model_id)
    except HTTPException as exc:
        try:
            await ws.send_json({"type": "error", "message": exc.detail})
        finally:
            await ws.close()
        return

    try:
        while True:
            msg = await ws.receive_json()
            sensors = msg.get("sensors")
            if not isinstance(sensors, list):
                await ws.send_json({"type": "error", "message": "sensors required"})
                continue
            try:
                action, outputs = decide(net, [float(x) for x in sensors])
            except Exception as exc:  # pragma: no cover
                await ws.send_json({"type": "error", "message": str(exc)})
                continue
            await ws.send_json({"type": "action", "action": action, "outputs": outputs})
    except WebSocketDisconnect:
        logger.debug("play ws disconnected")
    except Exception as exc:  # pragma: no cover
        logger.exception("play ws error: {}", exc)
