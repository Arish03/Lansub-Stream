import asyncio
import json
import logging
from datetime import datetime
import uuid
import paho.mqtt.client as mqtt
from sqlalchemy import select, update
from app.config import settings
from app.database import AsyncSessionLocal
from app.models import Device, Telemetry
from app.redis_client import redis_manager

logger = logging.getLogger("mqtt_worker")

class MQTTWorker:
    def __init__(self):
        self.client: mqtt.Client | None = None
        self.loop: asyncio.AbstractEventLoop | None = None

    def start(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop
        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="lansub-backend-bridge")
            self.client.on_connect = self.on_connect
            self.client.on_message = self.on_message
            self.client.connect_async(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, 60)
            self.client.loop_start()
            logger.info(f"MQTT Worker connecting to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}...")
        except Exception as e:
            logger.warning(f"Could not connect to external MQTT broker: {e}. HTTP and simulator ingestion active.")

    def stop(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("MQTT Worker stopped.")

    def on_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info("Connected to MQTT Broker!")
            client.subscribe(settings.MQTT_TOPIC_UPSTREAM)
            client.subscribe("devices/+/telemetry")
        else:
            logger.warning(f"MQTT connect returned reason code: {reason_code}")

    def on_message(self, client, userdata, msg):
        try:
            payload_str = msg.payload.decode("utf-8")
            data = json.loads(payload_str)
            logger.info(f"MQTT message received on {msg.topic}")

            # Schedule async database ingestion in event loop
            if self.loop and self.loop.is_running():
                asyncio.run_coroutine_threadsafe(self.process_payload(msg.topic, data), self.loop)
        except Exception as e:
            logger.error(f"Error handling MQTT message: {e}")

    async def process_payload(self, topic: str, data: dict):
        device_key = data.get("device_key")
        if not device_key and "/" in topic:
            parts = topic.split("/")
            if len(parts) >= 2 and parts[1] != "device":
                device_key = parts[1]

        if not device_key:
            return

        async with AsyncSessionLocal() as session:
            stmt = select(Device).where(Device.device_key == device_key)
            res = await session.execute(stmt)
            device = res.scalar_one_or_none()
            if not device:
                return

            now = datetime.now()
            record = Telemetry(
                id=uuid.uuid4(),
                device_id=device.id,
                ts=now,
                payload=data.get("payload", data)
            )
            session.add(record)
            await session.execute(
                update(Device).where(Device.id == device.id).values(last_seen_at=now)
            )
            await session.commit()

            await redis_manager.publish_telemetry(
                device_key=device.device_key,
                reading={
                    "id": str(record.id),
                    "device_id": str(device.id),
                    "device_key": device.device_key,
                    "device_name": device.name,
                    "ts": now.isoformat(),
                    "payload": data.get("payload", data)
                }
            )

mqtt_worker = MQTTWorker()
