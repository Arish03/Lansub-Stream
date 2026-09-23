import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Rule, User
from app.schemas import RuleCreate, RuleOut

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get("", response_model=List[RuleOut])
async def list_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Rule)
        .where(Rule.user_id == current_user.id)
        .order_by(Rule.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=RuleOut, status_code=status.HTTP_201_CREATED)
async def create_rule(
    rule_in: RuleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    new_rule = Rule(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=rule_in.name,
        description=rule_in.description,
        scope=rule_in.scope,
        target_id=rule_in.target_id,
        parameter=rule_in.parameter,
        operator=rule_in.operator,
        threshold=rule_in.threshold,
        unit=rule_in.unit,
        debounce_seconds=rule_in.debounce_seconds or "0s",
        actions=rule_in.actions or [],
        enabled=rule_in.enabled,
        triggers_count=0,
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    return new_rule


@router.patch("/{rule_id}/toggle", response_model=RuleOut)
async def toggle_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Rule).where(Rule.id == rule_id, Rule.user_id == current_user.id)
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )

    rule.enabled = not rule.enabled
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rule(
    rule_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Rule).where(Rule.id == rule_id, Rule.user_id == current_user.id)
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()

    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rule not found"
        )

    await db.delete(rule)
    await db.commit()
    return None
