import json
import logging
from typing import Any, Optional
import redis.asyncio as aioredis
from app.config import settings

logger = logging.getLogger("redis_client")

class RedisManager:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def connect(self):
        try:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis at {settings.REDIS_URL}: {e}")
            self.redis = None

    async def close(self):
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed.")

    async def publish_telemetry(self, device_key: str, reading: dict[str, Any]):
        """Publish reading to broadcast channel and per-device channel"""
        if not self.redis:
            return
        try:
            message = json.dumps({
                "device_key": device_key,
                "data": reading
            })
            # Publish to global channel
            await self.redis.publish(settings.REDIS_TELEMETRY_CHANNEL, message)
            # Also publish to specific device channel
            await self.redis.publish(f"lansub:device:{device_key}", message)
        except Exception as e:
            logger.error(f"Error publishing telemetry to Redis: {e}")

    def get_pubsub(self):
        if not self.redis:
            raise RuntimeError("Redis is not connected")
        return self.redis.pubsub()

redis_manager = RedisManager()
