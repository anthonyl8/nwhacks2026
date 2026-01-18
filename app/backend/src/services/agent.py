import os
import re
from typing import AsyncIterator, List, Dict, Optional
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
from app.backend.src.core.supabase import supabase, get_authenticated_client
from app.backend.src.core.config import settings
from app.backend.src.core.utils import Utils

# Import services
from app.backend.src.services.elevenlabs import ElevenLabsService

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

class LLMStreamError(Exception):
    pass

class AgentService:
    def __init__(self, token: Optional[str] = None, history: Optional[List[Dict[str, str]]] = None):
        if token:
            self.supabase = get_authenticated_client(token)
        else:
            self.supabase = supabase
            
        # Initialize the model
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.chat_history: List[Dict[str, str]] = history if history else []

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        reraise=True,
    )
    async def _send_message_stream(self, user_text: str, max_tokens: int = 300):
        # Convert internal history to Gemini history ensuring alternating roles
        gemini_history = []
        if self.chat_history:
            # Ensure the first message is from the user (Gemini requirement? Sometimes)
            # But primarily ensure alternating roles
            last_role = None
            for msg in self.chat_history:
                role = "user" if msg["role"] == "user" else "model"
                content = msg["content"]
                
                if role == last_role:
                    # Merge content with previous message to maintain alternating structure
                    gemini_history[-1]["parts"][0] += f"\n{content}"
                else:
                    gemini_history.append({"role": role, "parts": [content]})
                    last_role = role
        
        # Start a chat session with history
        chat = self.model.start_chat(history=gemini_history)
        
        return await chat.send_message_async(
            user_text,
            stream=True,
            generation_config=genai.types.GenerationConfig(
                temperature=0.4,
                max_output_tokens=max_tokens
            )
        )

    async def llm_token_stream(
        self,
        user_text: str,
        system_prompt: str = "You are a calm, concise wellness assistant.",
        max_tokens: int = 300,
        request_id: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """
        Streams tokens from the LLM as they are generated (Async).
        """
        # Update system instruction if needed (Gemini 1.5 allows this on init)
        # We'll create a new model instance to ensure system prompt is fresh
        self.model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_prompt)

        try:
            response_stream = await self._send_message_stream(user_text, max_tokens=max_tokens)
            
            full_response = ""
            async for chunk in response_stream:
                try:
                    text_chunk = chunk.text
                    if text_chunk:
                        full_response += text_chunk
                        yield text_chunk
                except ValueError:
                    continue
            
            # Update history
            self.chat_history.append({"role": "user", "content": user_text})
            self.chat_history.append({"role": "assistant", "content": full_response})

        except Exception as e:
            raise LLMStreamError("Unexpected LLM streaming failure") from e
    
    async def generate_audio_stream(self, user_text: str):
        """
        Generates audio stream from user text (Async).
        """
        token_stream = self.llm_token_stream(user_text)
        
        async for phrase in Utils.async_speech_chunks(token_stream):
            async for audio_chunk in ElevenLabsService.elevenlabs_stream(phrase):
                yield audio_chunk

    async def formulate_response(self, auth_id: str, features: dict):
        """
        Evaluates the user's biometrics and updates their state.
        """
        current_vibe = "Relaxed"
        if features:
            # Simple logic for demo
            current_vibe = "Stressed"
        
        data = {
            "user_id": auth_id, 
            "stress_score": 0, 
            "vibe": current_vibe,
            "note": f"Features processed: {features}"
        }
        
        try:
            # Async Supabase call
            await self.supabase.table("emotional_logs").insert(data).execute()
        except Exception as e:
            print(f"Error logging to Supabase: {e}")
        
        return current_vibe

    async def get_calming_suggestion(self, user_id: str):
        return "Let's take a deep breath."
