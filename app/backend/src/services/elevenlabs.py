import httpx
from backend.src.core.config import settings

class ElevenLabsService:
    @staticmethod
    async def elevenlabs_stream(text):
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}/stream"

        headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.35,
                "similarity_boost": 0.75
            }
        }

        async with httpx.AsyncClient() as client:
            async with client.stream("POST", url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_detail = await response.aread()
                    print(f"ElevenLabs API Error: {response.status_code} - {error_detail}")
                    raise Exception(f"ElevenLabs API Error: {response.status_code}")
                    
                async for chunk in response.aiter_bytes():
                    yield chunk
