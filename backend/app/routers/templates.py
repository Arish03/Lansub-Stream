import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import DeviceTemplate, User
from app.schemas import TemplateCreate, TemplateOut

router = APIRouter(prefix="/templates", tags=["Device Templates"])


@router.get("", response_model=List[TemplateOut])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(DeviceTemplate)
        .where(DeviceTemplate.user_id == current_user.id)
        .order_by(DeviceTemplate.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_in: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_template = DeviceTemplate(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=template_in.name,
        category=template_in.category,
        description=template_in.description,
        parameters=template_in.parameters or [],
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(DeviceTemplate).where(
        DeviceTemplate.id == template_id,
        DeviceTemplate.user_id == current_user.id,
    )
    res = await db.execute(stmt)
    tmpl = res.scalar_one_or_none()

    if not tmpl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    await db.delete(tmpl)
    await db.commit()
    return None
