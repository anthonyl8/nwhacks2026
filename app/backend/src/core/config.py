from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthSimple"

    # Supabase
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None # For backend admin tasks
    SUPABASE_JWT_SECRET: str = "your-jwt-secret"
    
    # ElevenLabs
    ELEVENLABS_API_KEY: str = "your-elevenlabs-api-key"
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM" # Default voice ID

    # Gemini
    OPENAI_API_KEY: str = "your-gemini-api-key"
    SUPABASE_JWKS: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
