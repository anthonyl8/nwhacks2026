from jose import jwt, JWTError
from fastapi import Request, HTTPException, Depends
from backend.src.core.config import settings

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Auth Token")

    token = auth_header.split(" ")[1]



    # --- PRODUCTION LOGIC: VALIDATE REAL JWT ---
    try:
        # Supabase uses your JWT_SECRET and the HS256 algorithm.
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"
        )
        return payload.get("sub")
    except JWTError as e:
        print(f"JWT Verification Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Session")