import requests

API_KEY = "YOUR_API_KEY"
VOICE_ID = "21m00Tcm4TlvDq8ikWAM"

class ElevenLabsService:
    @staticmethod
    def elevenlabs_stream(text):
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/stream"

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }

        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.35,
                "similarity_boost": 0.75
            }
        }

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            stream=True
        )

        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                yield chunk