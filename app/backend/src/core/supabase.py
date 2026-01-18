from supabase import create_client, Client
from app.backend.src.core.config import settings

# Initialize the Supabase client
# We use the Service Role Key (if available) for backend operations that bypass RLS,
# OR the Anon key if we just want to act as a public user (but usually backend needs admin rights).
# Ideally, use the secret key (Service Role) for the backend. 
# But for now we reused SUPABASE_KEY which might be anon.
# If you need to write to tables protected by RLS, ensure this key has permissions or use service_role.

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
