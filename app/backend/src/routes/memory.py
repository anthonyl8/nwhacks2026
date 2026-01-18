from fastapi import APIRouter, Depends
from app.backend.src.core.security import get_current_user
from app.backend.src.core.supabase import supabase

router = APIRouter(prefix="/memory", tags=["Memory"])

@router.get("/landmarks")
async def get_emotional_history(
    auth_id: str = Depends(get_current_user)
):
    # Get last 5 emotional logs using Supabase Client
    response = (
        supabase.table("emotional_logs")
        .select("*")
        .eq("user_id", auth_id)
        .order("timestamp", desc=True)
        .limit(5)
        .execute()
    )
    
    return {"history": response.data}
