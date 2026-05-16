from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import settings

bearer = HTTPBearer()

def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
    supabase: Client = None,
) -> dict:
    if supabase is None:
        supabase = get_supabase()
    try:
        response = supabase.auth.get_user(credentials.credentials)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": response.user.id, "email": response.user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
