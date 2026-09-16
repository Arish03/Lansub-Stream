from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.redis_client import redis_manager

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    # Check PostgreSQL
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1;"))
    except Exception as e:
        db_status = f"unhealthy: {e}"

    # Check Redis
    redis_status = "healthy"
    try:
        if redis_manager.redis:
            await redis_manager.redis.ping()
        else:
            redis_status = "not connected"
    except Exception as e:
        redis_status = f"unhealthy: {e}"

    overall = "ok" if db_status == "healthy" and redis_status == "healthy" else "degraded"

    return {
        "status": overall,
        "services": {
            "postgres": db_status,
            "redis": redis_status,
        }
    }
