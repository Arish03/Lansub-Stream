
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.auth import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.mongo import users_collection
from app.schemas import Token, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut)
async def register_user(user_in: UserCreate):
    # Check if user already exists in MongoDB
    existing_user = await users_collection.find_one(
        {"email": user_in.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create new user
    new_user = {
        "id": str(uuid.uuid4()),
        "email": user_in.email,
        "hashed_password": get_password_hash(user_in.password),
        "created_at": datetime.now(timezone.utc),
    }

    # Save user in MongoDB
    await users_collection.insert_one(new_user)

    return UserOut(
        id=new_user["id"],
        email=new_user["email"],
        created_at=new_user["created_at"],
    )


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    # Find user in MongoDB
    user = await users_collection.find_one(
        {"email": form_data.username}
    )

    if not user or not verify_password(
        form_data.password,
        user["hashed_password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create JWT token
    token = create_access_token(
        data={"sub": str(user["id"])}
    )

    user_out = UserOut(
        id=str(user["id"]),
        email=user["email"],
        created_at=user.get("created_at"),
    )

    return Token(
        access_token=token,
        token_type="bearer",
        user=user_out,
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    current_user=Depends(get_current_user)
):
    return UserOut(
        id=str(current_user["id"]),
        email=current_user["email"],
        created_at=current_user.get("created_at"),
    )