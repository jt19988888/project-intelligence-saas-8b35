from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    anthropic_api_key: str
    resend_api_key: str
    app_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173"

    model_config = {"env_file": ".env"}


settings = Settings()
