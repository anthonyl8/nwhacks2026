from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.backend.src.core.db import get_db
from app.backend.src.core.security import get_current_user
from app.backend.src.models import models

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync")

async def sync_user(
    clerk_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ensures the Clerk user has a corresponding record in our Postgres DB 
    to store their emotional landmarks and biometric history.
    """
    result = await db.execute(select(models.User).filter(models.User.clerk_id == clerk_id))
    user = result.scalars().first()

    if not user:
        new_user = models.User(clerk_id=clerk_id)
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return {"status": "User created", "id": new_user.id}
        
    return {"status": "User synced", "id": user.id}