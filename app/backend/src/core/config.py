from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthSimple"

    # Supabase
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-service-role-key-or-anon-key"
    SUPABASE_JWT_SECRET: str = "your-jwt-secret"
    SUPABASE_JWKS: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
