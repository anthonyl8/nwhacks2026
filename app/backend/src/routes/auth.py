from fastapi import APIRouter, Depends
from app.backend.src.core.security import get_current_user
from app.backend.src.core.supabase import get_authenticated_client

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/sync")
async def sync_user(
    user: dict = Depends(get_current_user)
):
    """
    Ensures the Supabase user has a corresponding record in our 'profiles' table.
    """
    auth_id = user["id"]
    email = user.get("email") or "unknown"
    
    # Use authenticated client
    client = get_authenticated_client(user["token"])

    # Check if profile exists
    response = await client.table("profiles").select("*").eq("id", auth_id).execute()
    
    if not response.data:
        # Create profile
        data = {"id": auth_id, "email": email}
        await client.table("profiles").insert(data).execute()
        return {"status": "Profile created", "id": auth_id}
        
    return {"status": "Profile synced", "id": auth_id}
