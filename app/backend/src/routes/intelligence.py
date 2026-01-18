import datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict

# Import services
from backend.src.core.security import get_current_user
from backend.src.services.agent_interaction_service import AgentService

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

class SpeakRequest(BaseModel):
    user_text: str
    history: Optional[List[Dict[str, str]]] = None
    features: dict
    
agent_service: AgentService
    
@router.post("/start")
async def init_agent(auth_id: str):
    global agent_service
    agent_service = AgentService(auth_id)


@router.post("/speak")
async def agent_speak(request: SpeakRequest):
    # StreamingResponse takes an async generator
    # Note: 'speak' endpoint here doesn't have auth in the signature in original code.
    # If we want to support RLS we should probably add Depends(get_current_user) but 
    # to avoid changing API signature too much if it's public, we'll leave it as is 
    # or assume it's public. However, AgentService defaults to global supabase client if no token.
    processed_features = await analyze_features(request.features)
    
    # agent_service.run_conversation(request.user_text, processed_features)
    
    async def audio_stream():
        global agent_service
        agent_service.chat_history = request.history if request.history else []
        # Call generate_audio_stream with the text string
        async for audio_chunk in agent_service.generate_audio_stream(request.user_text, processed_features):
            yield audio_chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg"
    )

async def analyze_features(features: dict):
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
    
    # Call formulate_response which returns a "vibe" state (string), NOT a StreamingResponse
    return processed_features

# For Testing
req = SpeakRequest(
    user_text="hey, I'm feeling sad", 
    history=[], 
    features={
        "blink_rate": 12,
        "ear_mean": 0.62,
        "jaw_tension": 0.01,
        "breathing_rate": 15,
        "breathing_amplitude": "high",
        "facial_variance": 0.03,
        "speaking": False,
        "head_motion": "low",
        "timestamp": "1:36PM EST on Oct 18, 2010",
        "current_time": "1:40PM EST on Oct 18, 2010"
    })

import asyncio
from io import BytesIO

async def collect_streaming_response(resp):
    buffer = BytesIO()

    async for chunk in resp.body_iterator:
        buffer.write(chunk)

    buffer.seek(0)
    return buffer

async def test_tts_save():
    resp = agent_speak(req)
    audio_bytes = await collect_streaming_response(resp)

    with open("test.mp3", "wb") as f:
        f.write(audio_bytes.read())
        
test_tts_save()


