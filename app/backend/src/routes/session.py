from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from app.backend.src.core.security import get_current_user
from app.backend.src.services.agent import AgentService
from app.backend.src.core.db import get_db, SessionLocal
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

router = APIRouter(prefix="/session", tags=["Session"])

async def get_ws_user(token: str = Query(...)):
    # Simple manual token check for WS since headers are tricky in JS WebSocket API
    try:
        # In real app: verify JWT signature
        # payload = jwt.decode(token, ...)
        # return payload["sub"]
        if not token:
             return None
        return "user_mock_id" # Mock user from token
    except JWTError:
        return None

@router.websocket("/ws")
async def wellness_session(
    websocket: WebSocket, 
    token: str = Query(...)
):
    await websocket.accept()
    
    # Authenticate
    # Note: In a real app, do this before accept or immediately after
    user_id = await get_ws_user(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Create a new DB session for this websocket connection life-cycle
    # Since we can't easily use Depends(get_db) in the loop
    async with SessionLocal() as db:
        agent = AgentService(db)
        try:
            while True:
                data = await websocket.receive_text()
                # Mock agent interaction
                # In reality, this would stream audio/text
                
                # Check for "heart rate" data in message if sent via WS
                # or just conversation text
                
                response_text = f"Agent heard: {data}. Relax..."
                await websocket.send_text(response_text)
                
        except WebSocketDisconnect:
            print(f"User {user_id} disconnected.")
