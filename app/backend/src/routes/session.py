from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.backend.src.core.security import get_current_user
from app.backend.src.services.agent import AgentService
from app.backend.src.core.config import settings
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
        if settings.SUPABASE_JWT_SECRET == "your-jwt-secret":
             return "user_mock_id"
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

    # Use AgentService (which now uses Supabase client)
    agent = AgentService()
    try:
        while True:
            data = await websocket.receive_text()
            # Mock agent interaction
            response_text = f"Agent heard: {data}. Relax..."
            await websocket.send_text(response_text)
            
    except WebSocketDisconnect:
        print(f"User {user_id} disconnected.")
