from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.backend.src.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

async def get_db():
    async with SessionLocal() as session:
        yield session
