import datetime
from fastapi import APIRouter, Depends
from backend.src.services.agent import AgentService
from backend.src.core.security import get_current_user

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.post("/features")
async def formulate_agent_response(
    features: dict, 
    auth_id: str = Depends(get_current_user)
):
    features['current_time'] = ''
    dt = datetime.datetime.fromtimestamp(features['timestamp'] / 1000)
    features['timestamp'] = dt.strftime('%l:%M%p %z on %b %d, %Y')
    agentService = AgentService()
    state = await agentService.agent_speak(features)
    return {"response": state}
