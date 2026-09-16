import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Device, Telemetry
from app.schemas import TelemetryCreate, TelemetryOut
from app.redis_client import redis_manager

router = APIRouter(prefix="/telemetry", tags=["Telemetry Ingestion"])

@router.post("", response_model=dict)
async def ingest_telemetry(
    data: TelemetryCreate,
    db: AsyncSession = Depends(get_db)
):
    # Lookup device by device_key
    stmt = select(Device).where(Device.device_key == data.device_key)
    res = await db.execute(stmt)
    device = res.scalar_one_or_none()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device with device_key '{data.device_key}' not found."
        )

    now = datetime.now()
    telemetry_record = Telemetry(
        id=uuid.uuid4(),
        device_id=device.id,
        ts=now,
        payload=data.payload
    )
    db.add(telemetry_record)

    # Update last_seen_at on device
    await db.execute(
        update(Device)
        .where(Device.id == device.id)
        .values(last_seen_at=now)
    )

    await db.commit()

    # Publish to Redis pub/sub bridge so WebSocket subscribers get it instantly
    await redis_manager.publish_telemetry(
        device_key=device.device_key,
        reading={
            "id": str(telemetry_record.id),
            "device_id": str(device.id),
            "device_key": device.device_key,
            "device_name": device.name,
            "ts": now.isoformat(),
            "payload": data.payload
        }
    )

    return {
        "status": "ok",
        "id": str(telemetry_record.id),
        "device_key": device.device_key,
        "timestamp": now.isoformat()
    }
