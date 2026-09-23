
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.database import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut)
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    # Check if user already exists
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    existing_user = res.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create new user in PostgreSQL
    new_user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserOut(
        id=str(new_user.id),
        email=new_user.email,
        created_at=new_user.created_at,
    )


DEMO_ACCOUNTS = {
    "superadmin@lansub.io": "superadmin_secure_2026",
    "operator@lansub.io": "operator_secure_2026",
    "engineer@lansub.io": "engineer_secure_2026",
}


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    # Find user in PostgreSQL
    stmt = select(User).where(User.email == form_data.username)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # Auto-provision predefined demo accounts on demand if not yet created in PostgreSQL
    if not user and form_data.username in DEMO_ACCOUNTS and form_data.password == DEMO_ACCOUNTS[form_data.username]:
        user = User(
            id=uuid.uuid4(),
            email=form_data.username,
            hashed_password=get_password_hash(form_data.password),
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user or not verify_password(
        form_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token
    token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )

    user_out = UserOut(
        id=str(user.id),
        email=user.email,
        created_at=user.created_at,
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user=user_out,
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        created_at=current_user.created_at,
    )