from supabase import create_async_client, AsyncClient
from app.backend.src.core.config import settings

# Initialize the Supabase client
# We prioritize the Service Role Key for backend operations to bypass RLS policies where necessary.
# If not provided, we fall back to the Anon Key (which may be restricted).

key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

supabase: AsyncClient = create_async_client(settings.SUPABASE_URL, key)

def get_authenticated_client(token: str) -> AsyncClient:
    """
    Returns a new AsyncClient instance authenticated with the user's JWT.
    This ensures RLS policies are applied correctly.
    """
    client = create_async_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    client.postgrest.auth(token)
    return client
