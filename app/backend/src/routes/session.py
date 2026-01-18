from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    status,
    Depends,
    HTTPException,
)
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any, cast
from backend.src.core.security import get_current_user
from backend.src.services.agent import AgentService
from backend.src.core.config import settings
from backend.src.core.supabase import supabase
from jose import jwt, JWTError

router = APIRouter(prefix="/sessions", tags=["Session"])


class SessionResponse(BaseModel):
    """Response model for a session"""

    session_id: str
    created_at: datetime
    note: Optional[str] = None


@router.get("/", response_model=List[SessionResponse])
async def get_sessions(user_id: str = Depends(get_current_user)):
    """
    Fetch all sessions belonging to the authenticated user.
    Returns a list of sessions with session_id, created_at, and note.
    """
    try:
        print(user_id)
        # Query sessions_info table for the user's sessions
        response = (
            supabase.table("sessions_info")
            .select("session_id, created_at, note")
            .eq("user_id", user_id)
            .execute()
        )
        print(response)
        # Return the list of sessions
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch sessions: {str(e)}"
        )


@router.delete("/{session_id}")
async def delete_session(session_id: str, user_id: str = Depends(get_current_user)):
    """
    Delete a session by session_id.
    Only allows users to delete their own sessions.
    """
    try:
        # First, verify the session belongs to the user
        check_response = (
            supabase.table("sessions_info")
            .select("session_id, user_id")
            .eq("session_id", session_id)
            .execute()
        )

        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(status_code=404, detail="Session not found")

        session = cast(Dict[str, Any], check_response.data[0])
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.get("user_id") != user_id:
            raise HTTPException(
                status_code=403, detail="Not authorized to delete this session"
            )

        # Delete the session
        supabase.table("sessions_info").delete().eq("session_id", session_id).execute()

        return {"message": "Session deleted successfully", "session_id": session_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete session: {str(e)}"
        )


async def get_ws_user(token: str = Query(...)):
    # Simple manual token check for WS
    try:
        # Verify Supabase JWT
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload["sub"]
    except JWTError:
        if settings.SUPABASE_JWT_SECRET == "your-jwt-secret":
            return "user_mock_id"
        return None


@router.websocket("/ws")
async def wellness_session(websocket: WebSocket, token: str = Query(...)):
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
