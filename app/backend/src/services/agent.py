from app.backend.src.core.supabase import supabase

class AgentService:
    def __init__(self):
        self.supabase = supabase

    async def evaluate_vitals(self, auth_id: str, hr: float):
        """
        Evaluates the user's biometrics and updates their state.
        """
        # 1. Get user profile (assuming a 'profiles' table linked to auth.users)
        # OR just insert into emotional_logs linked to user_id
        
        # NOTE: With Supabase, we might not have a separate 'users' table in public schema 
        # unless we created a 'profiles' table triggered on signup. 
        # For simplicity, we assume we can just log using auth_id as user_id.
        
        # 2. Determine state based on HR
        current_vibe = "Relaxed"
        if hr > 90:
            current_vibe = "Stressed"
        
        # 3. Log this emotional landmark
        data = {
            "user_id": auth_id, # Assuming column is UUID matching auth.users
            "stress_score": hr,
            "vibe": current_vibe,
            "note": f"Heart rate was {hr}"
        }
        
        response = self.supabase.table("emotional_logs").insert(data).execute()
        
        return current_vibe

    async def get_calming_suggestion(self, user_id: str):
        return "Let's take a deep breath."
