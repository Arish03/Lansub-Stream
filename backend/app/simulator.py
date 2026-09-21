import asyncio
import logging
import random
from datetime import datetime
import uuid
from typing import List, Dict, Any

from app.database import AsyncSessionLocal
from app.models import Device, Telemetry
from app.redis_client import redis_manager
from app.routers.ws import ws_manager

logger = logging.getLogger("simulator")

# Default demo devices used if database is offline or empty
FALLBACK_DEVICES = [
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "device_key": "dev_test123",
        "name": "DEV-001 (CNC Bearing Sensor)",
        "template": "generic-sensor"
    },
    {
        "id": "00000000-0000-0000-0000-000000000002",
        "device_key": "dev_spindle_1",
        "name": "DEV-002 (Spindle Motor Drive)",
        "template": "Motor Controller"
    },
    {
        "id": "00000000-0000-0000-0000-000000000003",
        "device_key": "dev_vibration_mon",
        "name": "DEV-003 (Cell Vibration Monitor)",
        "template": "generic-sensor"
    }
]

class DeviceSimulator:
    def __init__(self):
        self.running = False
        self.task: asyncio.Task | None = None

    async def start(self):
        self.running = True
        self.task = asyncio.create_task(self._simulation_loop())
        logger.info("Device simulator background worker started.")

    async def stop(self):
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Device simulator stopped.")

    async def _simulation_loop(self):
        # Allow server to initialize first
        await asyncio.sleep(2)
        while self.running:
            try:
                devices_to_simulate: List[Dict[str, Any]] = []
                pg_session = None

                # Try fetching registered devices from PostgreSQL
                try:
                    async with AsyncSessionLocal() as session:
                        from sqlalchemy import select
                        stmt = select(Device).limit(10)
                        res = await session.execute(stmt)
                        db_devices = res.scalars().all()
                        if db_devices:
                            for d in db_devices:
                                devices_to_simulate.append({
                                    "id": str(d.id),
                                    "device_key": d.device_key,
                                    "name": d.name,
                                    "template": d.template,
                                    "db_device": d
                                })
                except Exception as pg_err:
                    # Postgres is offline or unreachable; smoothly use fallback demo devices
                    logger.debug(f"Database not reachable for simulator ({pg_err}), using demo devices.")

                # If no devices in DB or DB offline, use fallback demo devices
                if not devices_to_simulate:
                    devices_to_simulate = FALLBACK_DEVICES

                for dev in devices_to_simulate:
                    now = datetime.now()
                    template = dev.get("template", "generic-sensor")

                    # Generate realistic industrial telemetry
                    if template == "generic-sensor":
                        payload = {
                            "temperature": round(38.0 + random.uniform(1.0, 12.5), 1),
                            "humidity": round(55.0 + random.uniform(2.0, 18.0), 1),
                            "vibration": round(0.02 + random.uniform(0.005, 0.095), 3),
                            "battery": random.randint(85, 99)
                        }
                    elif template == "Motor Controller":
                        payload = {
                            "speed": random.randint(1420, 1485),
                            "torque": round(80.0 + random.uniform(0.5, 9.5), 1),
                            "direction": "CW",
                            "load": f"{random.randint(62, 76)}%"
                        }
                    elif template == "Safety Camera":
                        payload = {
                            "fps": random.randint(28, 30),
                            "persons_detected": random.randint(1, 3),
                            "safety_gear_ok": True
                        }
                    else:
                        payload = {
                            "temperature": round(40.0 + random.uniform(2.0, 8.0), 1),
                            "val_a": round(random.uniform(10.0, 95.0), 2),
                            "status": "optimal"
                        }

                    reading_id = str(uuid.uuid4())
                    device_id = dev["id"]
                    device_key = dev["device_key"]
                    device_name = dev["name"]

                    reading = {
                        "id": reading_id,
                        "device_id": device_id,
                        "device_key": device_key,
                        "device_name": device_name,
                        "ts": now.isoformat(),
                        "payload": payload
                    }

                    broadcast_message = {
                        "device_key": device_key,
                        "data": reading
                    }

                    # 1. Try persisting to PostgreSQL if available
                    if "db_device" in dev:
                        try:
                            async with AsyncSessionLocal() as save_session:
                                from sqlalchemy import update
                                record = Telemetry(
                                    id=uuid.UUID(reading_id),
                                    device_id=uuid.UUID(device_id),
                                    ts=now,
                                    payload=payload
                                )
                                save_session.add(record)
                                await save_session.execute(
                                    update(Device).where(Device.id == uuid.UUID(device_id)).values(last_seen_at=now)
                                )
                                await save_session.commit()
                        except Exception:
                            pass

                    # 2. Publish to Redis Pub/Sub if connected
                    await redis_manager.publish_telemetry(device_key=device_key, reading=reading)

                    # 3. Direct broadcast to WebSocket clients (guarantees live dashboard updates even without Redis)
                    await ws_manager.broadcast_json(broadcast_message)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in device simulator loop: {e}")

            # Stream updates every 3 seconds for dynamic real-time feel
            await asyncio.sleep(3)

device_simulator = DeviceSimulator()

async def run_standalone():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    logger.info("Connecting to Redis...")
    await redis_manager.connect()
    logger.info("Starting standalone Device Simulator (Press Ctrl+C to stop)...")
    await device_simulator.start()
    try:
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, asyncio.CancelledError):
        logger.info("Stopping standalone simulator...")
        await device_simulator.stop()
        await redis_manager.close()

if __name__ == "__main__":
    try:
        asyncio.run(run_standalone())
    except KeyboardInterrupt:
        pass
