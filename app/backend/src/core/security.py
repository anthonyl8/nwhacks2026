from fastapi import HTTPException, Request
from jose import jwt, JWTError
from app.backend.src.core.config import settings

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Auth Token")
    
    token = auth_header.split(" ")[1]
    
    try:
        # Verify the token using the Supabase JWT Secret
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"],
            audience="authenticated" # Supabase default audience
        )
        return {"id": payload["sub"], "email": payload.get("email"), "token": token}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid Session")
