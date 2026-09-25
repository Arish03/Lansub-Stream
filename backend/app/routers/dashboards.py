import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Dashboard, User
from app.schemas import DashboardCreate, DashboardUpdate, DashboardOut

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("", response_model=List[DashboardOut])
async def list_dashboards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Dashboard)
        .where(Dashboard.user_id == current_user.id)
        .order_by(Dashboard.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=DashboardOut, status_code=status.HTTP_201_CREATED)
async def create_dashboard(
    dashboard_in: DashboardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_dashboard = Dashboard(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=dashboard_in.name,
        description=dashboard_in.description,
        is_default=dashboard_in.is_default,
        layout=dashboard_in.layout or [],
    )
    db.add(new_dashboard)
    await db.commit()
    await db.refresh(new_dashboard)
    return new_dashboard


@router.get("/{dashboard_id}", response_model=DashboardOut)
async def get_dashboard(
    dashboard_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Dashboard).where(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    dashboard = res.scalar_one_or_none()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )
    return dashboard


@router.put("/{dashboard_id}", response_model=DashboardOut)
async def update_dashboard(
    dashboard_id: uuid.UUID,
    dashboard_in: DashboardUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Dashboard).where(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    dashboard = res.scalar_one_or_none()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    if dashboard_in.name is not None:
        dashboard.name = dashboard_in.name
    if dashboard_in.description is not None:
        dashboard.description = dashboard_in.description
    if dashboard_in.is_default is not None:
        dashboard.is_default = dashboard_in.is_default
    if dashboard_in.layout is not None:
        dashboard.layout = dashboard_in.layout

    dashboard.updated_at = datetime.now()
    await db.commit()
    await db.refresh(dashboard)
    return dashboard


@router.delete("/{dashboard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dashboard(
    dashboard_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Dashboard).where(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    dashboard = res.scalar_one_or_none()
    if not dashboard:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dashboard not found"
        )

    await db.delete(dashboard)
    await db.commit()
    return None
