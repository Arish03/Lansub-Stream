import asyncio
import json
import logging
from typing import Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import settings
from app.redis_client import redis_manager

logger = logging.getLogger("websocket")
router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.listener_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_json(self, data: dict):
        if not self.active_connections:
            return
        dead_connections = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()

async def redis_listener():
    """Background listener that pulls from Redis pub/sub and pushes to WebSockets"""
    while True:
        try:
            if not redis_manager.redis:
                await asyncio.sleep(2)
                continue

            pubsub = redis_manager.get_pubsub()
            await pubsub.subscribe(settings.REDIS_TELEMETRY_CHANNEL)
            logger.info(f"Subscribed to Redis channel: {settings.REDIS_TELEMETRY_CHANNEL}")

            async for message in pubsub.listen():
                if message and message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        await ws_manager.broadcast_json(data)
                    except Exception as e:
                        logger.error(f"Error parsing Redis message: {e}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Redis listener error: {e}, reconnecting in 3s...")
            await asyncio.sleep(3)

@router.websocket("/ws")
@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial welcome packet
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to Lansub Stream real-time telemetry feed",
            "channel": settings.REDIS_TELEMETRY_CHANNEL
        })
        while True:
            # Keep connection alive, listen for client messages / pings
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket exception: {e}")
        ws_manager.disconnect(websocket)
