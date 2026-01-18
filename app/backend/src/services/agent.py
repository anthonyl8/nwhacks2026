from backend.src.core.supabase import supabase


class AgentService:
    def __init__(self):
        self.supabase = supabase

    async def formulate_response(self, auth_id: str, features: dict):
        """
        Evaluates the user's biometrics and updates their state.
        """
        # 1. Get user profile (assuming a 'profiles' table linked to auth.users)
        # OR just insert into emotional_logs linked to user_id

        # NOTE: With Supabase, we might not have a separate 'users' table in public schema
        # unless we created a 'profiles' table triggered on signup.
        # For simplicity, we assume we can just log using auth_id as user_id.

        # 2. Determine state based on HR

        """
        features: 
        - text
        - 
        """
        current_vibe = "Relaxed"
        if features:
            current_vibe = "Stressed"

        # 3. Log this emotional landmark
        data = {
            "user_id": auth_id,  # Assuming column is UUID matching auth.users
            "stress_score": features,
            "vibe": current_vibe,
            "note": f"Heart rate was {features}",
        }

        response = self.supabase.table("emotional_logs").insert(data).execute()

        return current_vibe

    async def get_calming_suggestion(self, user_id: str):
        return "Let's take a deep breath."
