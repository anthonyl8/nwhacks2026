from fastapi import APIRouter, Depends
from backend.src.services.agent import AgentService
from backend.src.core.security import get_current_user

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


@router.post("/features")
async def formulate_agent_response(
    features: dict, auth_id: str = Depends(get_current_user)
):
    agent = AgentService()
    state = await agent.formulate_response(auth_id, features)
    return {"response": state}
