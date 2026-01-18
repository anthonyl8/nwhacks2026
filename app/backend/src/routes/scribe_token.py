from fastapi import APIRouter
import requests
from backend.src.core.config import settings

router = APIRouter(prefix="/scribe")


@router.get("/")
def get_temp_token():
    """Request a single-use realtime_scribe token from ElevenLabs and return its JSON.

    Forwards non-2xx responses as HTTPExceptions so the client sees the error.
    """
    url = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"
    headers = {"xi-api-key": settings.ELEVENLABS_API_KEY}

    response = requests.request("POST", url, headers=headers)

    print(response.text)
    return response.json()
