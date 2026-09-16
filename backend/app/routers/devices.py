import secrets
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth import get_current_user
from app.database import get_db
from app.models import Device, Telemetry, User
from app.schemas import DeviceCreate, DeviceOut, TelemetryOut, CommandSend
from app.redis_client import redis_manager

router = APIRouter(prefix="/devices", tags=["Devices"])

@router.get("", response_model=List[DeviceOut])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Device).where(Device.user_id == current_user.id).order_by(Device.created_at.desc())
    res = await db.execute(stmt)
    devices = res.scalars().all()

    device_list = []
    for dev in devices:
        # Fetch latest telemetry for Digital Twin
        t_stmt = (
            select(Telemetry)
            .where(Telemetry.device_id == dev.id)
            .order_by(desc(Telemetry.ts))
            .limit(1)
        )
        t_res = await db.execute(t_stmt)
        latest_telemetry = t_res.scalar_one_or_none()

        dev_dict = {
            "id": dev.id,
            "user_id": dev.user_id,
            "name": dev.name,
            "device_key": dev.device_key,
            "mqtt_username": dev.mqtt_username,
            "template": dev.template,
            "created_at": dev.created_at,
            "last_seen_at": dev.last_seen_at,
            "telemetry": latest_telemetry.payload if latest_telemetry else None
        }
        device_list.append(dev_dict)

    return device_list

@router.post("", response_model=DeviceOut)
async def create_device(
    device_in: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    random_hex = secrets.token_hex(4)
    device_key = f"dev_{random_hex}"
    mqtt_user = f"mqtt_{random_hex}"
    mqtt_pass = secrets.token_urlsafe(12)

    new_device = Device(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=device_in.name,
        device_key=device_key,
        mqtt_username=mqtt_user,
        mqtt_password=mqtt_pass,
        template=device_in.template or "generic-sensor",
    )
    db.add(new_device)
    await db.commit()
    await db.refresh(new_device)
    return new_device

@router.get("/{device_id}", response_model=DeviceOut)
async def get_device(
    device_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    res = await db.execute(stmt)
    dev = res.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    t_stmt = (
        select(Telemetry)
        .where(Telemetry.device_id == dev.id)
        .order_by(desc(Telemetry.ts))
        .limit(1)
    )
    t_res = await db.execute(t_stmt)
    latest_telemetry = t_res.scalar_one_or_none()

    return {
        "id": dev.id,
        "user_id": dev.user_id,
        "name": dev.name,
        "device_key": dev.device_key,
        "mqtt_username": dev.mqtt_username,
        "template": dev.template,
        "created_at": dev.created_at,
        "last_seen_at": dev.last_seen_at,
        "telemetry": latest_telemetry.payload if latest_telemetry else None
    }

@router.delete("/{device_id}")
async def delete_device(
    device_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    res = await db.execute(stmt)
    dev = res.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    await db.delete(dev)
    await db.commit()
    return {"message": "Device deleted successfully", "id": str(device_id)}

@router.get("/{device_id}/telemetry", response_model=List[TelemetryOut])
async def get_device_telemetry(
    device_id: uuid.UUID,
    limit: int = Query(default=100, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify device belongs to user
    dev_stmt = select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    dev_res = await db.execute(dev_stmt)
    if not dev_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    # Fast indexed query: idx_telemetry_device_ts
    stmt = (
        select(Telemetry)
        .where(Telemetry.device_id == device_id)
        .order_by(desc(Telemetry.ts))
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{device_id}/commands")
async def send_device_command(
    device_id: uuid.UUID,
    command: CommandSend,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    dev_stmt = select(Device).where(Device.id == device_id, Device.user_id == current_user.id)
    dev_res = await db.execute(dev_stmt)
    dev = dev_res.scalar_one_or_none()
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    # Broadcast downstream command over Redis pubsub
    cmd_data = {
        "command": command.action,
        "target": command.target,
        "value": command.value,
        "device_key": dev.device_key
    }
    await redis_manager.publish_telemetry(dev.device_key, {"downstream_command": cmd_data})

    return {
        "status": "queued",
        "device_id": str(device_id),
        "device_key": dev.device_key,
        "command": cmd_data
    }
