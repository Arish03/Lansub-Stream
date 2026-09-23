import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Alarm, User
from app.schemas import AlarmOut

router = APIRouter(prefix="/alarms", tags=["Alarms"])


@router.get("", response_model=List[AlarmOut])
async def list_alarms(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Alarm).where(Alarm.user_id == current_user.id)
    if status_filter:
        stmt = stmt.where(Alarm.status == status_filter.upper())
    stmt = stmt.order_by(Alarm.created_at.desc())

    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{alarm_id}/acknowledge", response_model=AlarmOut)
async def acknowledge_alarm(
    alarm_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Alarm).where(Alarm.id == alarm_id, Alarm.user_id == current_user.id)
    res = await db.execute(stmt)
    alarm = res.scalar_one_or_none()

    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found"
        )

    alarm.status = "ACKNOWLEDGED"
    alarm.acknowledged_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alarm)
    return alarm


@router.post("/{alarm_id}/resolve", response_model=AlarmOut)
async def resolve_alarm(
    alarm_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Alarm).where(Alarm.id == alarm_id, Alarm.user_id == current_user.id)
    res = await db.execute(stmt)
    alarm = res.scalar_one_or_none()

    if not alarm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alarm not found"
        )

    alarm.status = "RESOLVED"
    alarm.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alarm)
    return alarm
