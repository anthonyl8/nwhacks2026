from fastapi import HTTPException, Request
from jose import jwt, JWTError
from backend.src.core.config import settings
import requests


async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Auth Token")

    token = auth_header.split(" ")[1]
    jwks = requests.get(settings.SUPABASE_JWKS).json()
    try:
        # Verify the token using the Supabase JWT Secret
        payload = jwt.decode(
            token, jwks, algorithms=["ES256"], audience="authenticated"
        )
        return payload["sub"]  # This is the UUID of the user in Supabase
    except JWTError:
        # Fallback for hackathon if secrets aren't set up perfectly or for testing
        # In production, DO NOT allow this.
        if settings.SUPABASE_JWT_SECRET == "your-jwt-secret":
            # If default/unset, assume mock
            return "user_mock_id"
        raise HTTPException(status_code=401, detail="Invalid Session")
