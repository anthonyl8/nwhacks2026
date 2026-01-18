from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.backend.src.core.db import get_db
from app.backend.src.core.security import get_current_user
from app.backend.src.models import models

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("/landmarks")
async def get_emotional_history(
    clerk_id: str = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    # 1. Get user
    result = await db.execute(select(models.User).filter(models.User.clerk_id == clerk_id))
    user = result.scalars().first()
    
    if not user:
         raise HTTPException(status_code=404, detail="User not found")

    # 2. Get last 5 emotional logs
    logs_result = await db.execute(
        select(models.EmotionalLog)
        .filter(models.EmotionalLog.user_id == user.id)
        .order_by(models.EmotionalLog.timestamp.desc())
        .limit(5)
    )
    logs = logs_result.scalars().all()
    
    return {"history": logs}
