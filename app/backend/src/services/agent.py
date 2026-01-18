from sqlalchemy.ext.asyncio import AsyncSession
from app.backend.src.models import models
from sqlalchemy import select

class AgentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_vitals(self, clerk_id: str, hr: float):
        """
        Evaluates the user's biometrics and updates their state.
        This is a simplified agentic logic for the hackathon.
        """
        # 1. Get user from DB
        result = await self.db.execute(select(models.User).filter(models.User.clerk_id == clerk_id))
        user = result.scalars().first()
        
        if not user:
            return "User not found"

        # 2. Determine state based on HR
        # Simple logic: If HR > 90, they are stressed.
        current_vibe = "Relaxed"
        if hr > 90:
            current_vibe = "Stressed"
        
        # 3. Log this emotional landmark
        new_log = models.EmotionalLog(
            user_id=user.id,
            stress_score=hr, # Using HR as a proxy for stress score for now
            vibe=current_vibe,
            note=f"Heart rate was {hr}"
        )
        self.db.add(new_log)
        await self.db.commit()
        await self.db.refresh(new_log)
        
        return current_vibe

    async def get_calming_suggestion(self, user_id: int):
        # Placeholder for more complex agent logic
        return "Let's take a deep breath."
