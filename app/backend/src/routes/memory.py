from fastapi import APIRouter, Depends
from app.backend.src.core.security import get_current_user
from app.backend.src.core.supabase import get_authenticated_client

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("/landmarks")
async def get_emotional_history(
    user: dict = Depends(get_current_user)
):
    # Get last 5 emotional logs using Supabase Async Client
    client = get_authenticated_client(user["token"])
    
    response = await (
        client.table("emotional_logs")
        .select("*")
        .eq("user_id", user["id"])
        .order("timestamp", desc=True)
        .limit(5)
        .execute()
    )
    
    return {"history": response.data}
