import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict

# Import services
from backend.src.core.security import get_current_user
from backend.src.services.agent import AgentService

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

class SpeakRequest(BaseModel):
    user_text: str
    history: Optional[List[Dict[str, str]]] = None

@router.post("/features")
async def formulate_agent_response(
    features: dict, auth_id: str = Depends(get_current_user)
):
    # Logic for processing biometric features
    # Create a copy to avoid mutating the input dictionary
    processed_features = features.copy()
    processed_features['current_time'] = ''
    
    # Handle potentially missing timestamp
    ts = processed_features.get('timestamp')
    if ts:
        try:
            # Handle string timestamp (e.g. from JSON)
            if isinstance(ts, str):
                ts = float(ts)
            dt = datetime.datetime.fromtimestamp(ts / 1000)
            processed_features['timestamp'] = dt.strftime('%l:%M%p %z on %b %d, %Y')
        except (ValueError, TypeError):
             processed_features['timestamp'] = "unknown time"
    else:
         processed_features['timestamp'] = "unknown time"
    
    # Pass token to AgentService
    agent_service = AgentService(token=user["token"])
    # Call formulate_response which returns a "vibe" state (string), NOT a StreamingResponse
    state = await agent_service.update_physical_data(processed_features)
    return {"response": state}

@router.post("/speak")
async def agent_speak(request: SpeakRequest):
    # StreamingResponse takes an async generator
    # Note: 'speak' endpoint here doesn't have auth in the signature in original code.
    # If we want to support RLS we should probably add Depends(get_current_user) but 
    # to avoid changing API signature too much if it's public, we'll leave it as is 
    # or assume it's public. However, AgentService defaults to global supabase client if no token.
    async def audio_stream():
        agent_service = AgentService(history=request.history) 
        # Call generate_audio_stream with the text string
        async for audio_chunk in agent_service.generate_audio_stream(request.user_text):
            yield audio_chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg"
    )
