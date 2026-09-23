import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Asset, User
from app.schemas import AssetCreate, AssetOut

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=List[AssetOut])
async def list_assets(
    parent_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Asset).where(Asset.user_id == current_user.id)
    if parent_id is not None:
        stmt = stmt.where(Asset.parent_id == parent_id)
    stmt = stmt.order_by(Asset.name.asc())

    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_in: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parsed_parent = uuid.UUID(str(asset_in.parent_id)) if asset_in.parent_id else None
    new_asset = Asset(
        id=uuid.uuid4(),
        user_id=current_user.id,
        parent_id=parsed_parent,
        name=asset_in.name,
        type=asset_in.type,
        criticality=asset_in.criticality,
        health_score=asset_in.health_score,
        metadata_json=asset_in.metadata_json or {},
    )
    db.add(new_asset)
    await db.commit()
    await db.refresh(new_asset)
    return new_asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Asset).where(
        Asset.id == asset_id,
        Asset.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    asset = res.scalar_one_or_none()

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )

    await db.delete(asset)
    await db.commit()
    return None
