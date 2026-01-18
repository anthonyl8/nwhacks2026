import os
from typing import Iterator, List, Dict, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from backend.src.core.supabase import supabase
from fastapi.responses import StreamingResponse

# Import services
from backend.src.services.elevenlabs import ElevenLabsService
from backend.src.core.utils import Utils

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

class LLMStreamError(Exception):
    pass

class AgentService:
    def __init__(self):
        self.supabase = supabase
        # Initialize the model
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        reraise=True,
    )
    def _start_stream(self, messages: List[Dict[str, str]]):
        # Convert OpenAI-style messages to Gemini history/prompt
        # Gemini uses 'user' and 'model' roles. 'system' instructions are usually passed at model init 
        # or as the first part.
        
        # Simple conversion for hackathon:
        # We'll just concatenate for now or format cleanly.
        # Ideally, use system_instruction in GenerativeModel init if possible, 
        # but since we init once, we might pass it in the prompt.
        
        system_instruction = next((m["content"] for m in messages if m["role"] == "system"), None)
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")
        
        # If we want to support history, we'd build the chat history list.
        # For this function which takes a list, let's assume it's just system + user for now.
        
        # We can use a fresh model with system instruction for each request if needed,
        # but instantiating model is cheap.
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_instruction)
        
        return model.generate_content(
            user_message,
            stream=True,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=300
            )
        )

    def llm_token_stream(
        self,
        user_text: str,
        system_prompt: str = "You are a calm, concise wellness assistant.",
        max_tokens: int = 300,
        request_id: Optional[str] = None,
    ) -> Iterator[str]:
        """
        Streams tokens from the LLM as they are generated.

        Yields:
            str: text token chunks
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ]

        try:
            response_stream = self._start_stream(messages)

            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            # Gemini exceptions are a bit broad, wrapping them all
            raise LLMStreamError("Unexpected LLM streaming failure") from e
        
    async def agent_speak(request: str):
        def audio_stream():
            # Instantiate AgentService
            agent_service = AgentService()
            # Use the instance method llm_token_stream
            for phrase in Utils.speech_chunks(agent_service.llm_token_stream(request.user_text)):
                for audio_chunk in ElevenLabsService.elevenlabs_stream(phrase):
                    yield audio_chunk

        return StreamingResponse(
            audio_stream(),
            media_type="audio/mpeg"
        )


    async def formulate_response(self, auth_id: str, features: dict):
        """
        Evaluates the user's biometrics and updates their state.
        """
        current_vibe = "Relaxed"
        if features:
            current_vibe = "Stressed"
        
        # 3. Log this emotional landmark
        data = {
            "user_id": auth_id, 
            "stress_score": 0, 
            "vibe": current_vibe,
            "note": f"Features processed: {features}"
        }
        
        # response = self.supabase.table("emotional_logs").insert(data).execute()
        
        return current_vibe

    async def get_calming_suggestion(self, user_id: str):
        return "Let's take a deep breath."
