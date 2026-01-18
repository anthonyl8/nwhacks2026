from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from backend.src.core.config import settings
from backend.src.services.agent import AgentService
from jose import jwt, JWTError

router = APIRouter(prefix="/session", tags=["Session"])

async def get_ws_user(token: str = Query(...)):
    # Simple manual token check for WS
    try:
        # Verify Supabase JWT
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload["sub"]
    except JWTError:
        return None

@router.websocket("/ws")
async def wellness_session(
    websocket: WebSocket, 
    token: str = Query(...)
):
    await websocket.accept()
    
    # Authenticate
    user_id = await get_ws_user(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Pass the token to AgentService for authenticated requests
    agent_service = AgentService(token=token)

    try:
        while True:
            # Receive text input from client
            data = await websocket.receive_text()
            
            try:
                # Generate audio stream using AgentService (Gemini -> ElevenLabs)
                # This returns an ASYNC iterator of bytes (mp3 chunks)
                audio_generator = agent_service.generate_audio_stream(data)
                
                async for chunk in audio_generator:
                    # Send audio bytes to client
                    await websocket.send_bytes(chunk)
            except Exception as e:
                print(f"Error generating audio: {e}")
                await websocket.send_text(f"Error: {str(e)}")
            
            # Optionally send a text message indicating end of turn
            # await websocket.send_text("END_OF_AUDIO") 

    except WebSocketDisconnect:
        print(f"User {user_id} disconnected.")
