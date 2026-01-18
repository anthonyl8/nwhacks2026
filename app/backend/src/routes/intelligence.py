from fastapi import APIRouter, Depends
from app.backend.src.services.agent import AgentService
from app.backend.src.core.security import get_current_user

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.post("/ingest")
async def ingest_biometrics(
    heart_rate: float, 
    auth_id: str = Depends(get_current_user)
):
    agent = AgentService()
    state = await agent.evaluate_vitals(auth_id, heart_rate)
    return {"current_state": state}
