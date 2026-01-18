from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.backend.src.services.agent import AgentService
from app.backend.src.core.db import get_db
from app.backend.src.core.security import get_current_user

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.post("/ingest")
async def ingest_biometrics(
    heart_rate: float, 
    clerk_id: str = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    agent = AgentService(db)
    state = await agent.evaluate_vitals(clerk_id, heart_rate)
    return {"current_state": state}
