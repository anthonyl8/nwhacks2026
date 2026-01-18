import uuid
from fastapi import APIRouter, Depends
from backend.src.core.security import get_current_user
from backend.src.core.supabase import supabase

router = APIRouter(prefix="/memory", tags=["Memory"])


@router.get("/landmarks")
async def get_emotional_history(auth_id: str = Depends(get_current_user)):
    # Get last 5 emotional logs using Supabase Client
    auth_id = auth_id.strip()
    print(f"ACTUAL ROUTE DEBUG: auth_id from get_current_user is '{auth_id}'")
    response = (
        supabase.table("good_moments")
        .select("*")
        .eq("user_id", auth_id)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )

    return {"history": response.data}

@router.get("/debug-supabase")
async def debug_supabase(auth_id: str):
    # 1. Verify Client Config
    print(f"URL: {supabase.supabase_url}")
    # Verify the key starts with 'ey' (standard JWT start)
    print(f"Key exists: {bool(supabase.supabase_key)}")

    # 2. Test a 'Select All' (Ignore ID for a second)
    # This proves the connection and table name are valid
    all_data = supabase.table("good_moments").select("*").limit(1).execute()
    print(f"Raw Table Access Test: {all_data.data}")

    # 3. Test the Filter with .strip()
    clean_id = auth_id.strip()
    filtered_data = supabase.table("good_moments").select("*").eq("user_id", clean_id).execute()
    
    return {
        "input_id": clean_id,
        "table_accessible": len(all_data.data) > 0,
        "filter_match": len(filtered_data.data) > 0,
        "data": filtered_data.data
    }
