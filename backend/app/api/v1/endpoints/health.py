from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.base import ResponseModel
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("", response_model=ResponseModel[HealthResponse])
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {e!s}"

    health_data = HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        version="0.1.0",
        environment=settings.ENVIRONMENT,
        dependencies={
            "database": db_status,
            "storage": "connected",
        },
    )
    return ResponseModel(data=health_data)
