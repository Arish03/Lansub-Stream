import asyncio
import logging
import random
from datetime import datetime
import uuid
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import Device, Telemetry
from app.redis_client import redis_manager

logger = logging.getLogger("simulator")

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
        await asyncio.sleep(5)
        while self.running:
            try:
                async with AsyncSessionLocal() as session:
                    stmt = select(Device).limit(10)
                    res = await session.execute(stmt)
                    devices = res.scalars().all()

                    for dev in devices:
                        now = datetime.now()
                        # Generate realistic telemetry based on template
                        if dev.template == "generic-sensor":
                            payload = {
                                "temperature": round(20.0 + random.uniform(2.0, 15.0), 2),
                                "humidity": round(40.0 + random.uniform(5.0, 30.0), 1),
                                "vibration": round(random.uniform(0.01, 0.25), 3),
                                "battery": random.randint(85, 100)
                            }
                        elif dev.template == "Motor Controller":
                            payload = {
                                "speed": random.randint(1420, 1490),
                                "torque": round(80 + random.uniform(0, 10), 1),
                                "direction": "CW",
                                "load": f"{random.randint(60, 75)}%"
                            }
                        elif dev.template == "Safety Camera":
                            payload = {
                                "fps": random.randint(28, 30),
                                "persons_detected": random.randint(1, 4),
                                "safety_gear_ok": True
                            }
                        else:
                            payload = {
                                "val_a": round(random.uniform(10.0, 100.0), 2),
                                "status": "active"
                            }

                        # Save to Postgres
                        record = Telemetry(
                            id=uuid.uuid4(),
                            device_id=dev.id,
                            ts=now,
                            payload=payload
                        )
                        session.add(record)

                        # Update last_seen_at
                        await session.execute(
                            update(Device).where(Device.id == dev.id).values(last_seen_at=now)
                        )
                        await session.commit()

                        # Publish to Redis pub/sub
                        await redis_manager.publish_telemetry(
                            device_key=dev.device_key,
                            reading={
                                "id": str(record.id),
                                "device_id": str(dev.id),
                                "device_key": dev.device_key,
                                "device_name": dev.name,
                                "ts": now.isoformat(),
                                "payload": payload
                            }
                        )

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in device simulator loop: {e}")

            # Sleep between simulator batches (e.g. every 5 seconds)
            await asyncio.sleep(5)

device_simulator = DeviceSimulator()
