from fastapi import APIRouter, Depends
from backend.src.core.security import get_current_user
from backend.src.core.supabase import supabase

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/sync")
async def sync_user(auth_id: str = Depends(get_current_user)):
    """
    Ensures the Supabase user has a corresponding record in our 'profiles' table.
    """
    auth_id = user["id"]
    email = user.get("email") or "unknown"
    
    # Use authenticated client
    client = get_authenticated_client(user["token"])

    # Check if profile exists
    response = supabase.table("profiles").select("*").eq("id", auth_id).execute()

    if not response.data:
        # Create profile
        # Assuming 'profiles' table has 'id' which references auth.users(id)
        data = {
            "id": auth_id,
            "email": "unknown",
        }  # We might need email from token or request body
        supabase.table("profiles").insert(data).execute()
        return {"status": "Profile created", "id": auth_id}

    return {"status": "Profile synced", "id": auth_id}
