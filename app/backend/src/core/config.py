from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthSimple"
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/healthsimple"
    
    # Clerk
    CLERK_FRONTEND_API: str = "pk_test_..."
    CLERK_API_KEY: str = "sk_test_..."
    CLERK_JWKS_URL: str = "https://clerk.your-domain.com/.well-known/jwks.json"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
