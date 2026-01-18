import httpx
from fastapi import HTTPException, Depends, Request
from jose import jwt
from app.backend.src.core.config import settings

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Clerk Token")
    
    token = auth_header.split(" ")[1]
    
    # In a real implementation, you would verify the token signature using the JWKS from Clerk
    # For now, we are mocking the verification or doing a simple decode if needed
    # keys = httpx.get(settings.CLERK_JWKS_URL).json()
    
    try:
        # payload = jwt.decode(token, key=..., algorithms=["RS256"])
        # return payload["sub"]
        
        # Mock implementation for hackathon velocity if JWKS is not set up
        # In production, UNCOMMENT the verification logic
        return "user_mock_id" 
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Session")
