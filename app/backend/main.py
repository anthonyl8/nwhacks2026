from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.src.routes import session, intelligence, memory, scribe_token
from backend.src.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0", lifespan=lifespan)

origins = [
    "*",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router)
app.include_router(intelligence.router)
app.include_router(memory.router)
app.include_router(scribe_token.router)


@app.get("/")
async def root():
    return {"status": "HealthSimple Online"}
