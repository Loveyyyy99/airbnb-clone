"""Runtime configuration, read from environment variables with local-dev defaults."""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


ON_VERCEL = bool(os.getenv("VERCEL"))
_vercel_host = os.getenv("VERCEL_PROJECT_PRODUCTION_URL") or os.getenv("VERCEL_URL") or ""


def _db_url() -> str:
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("POSTGRES_PRISMA_URL") or ""
    if not url:
        return "sqlite:////tmp/airbnb.db" if ON_VERCEL else f"sqlite:///{BASE_DIR / 'airbnb.db'}"
    # hosted Postgres providers (Neon, Supabase, Vercel Postgres) hand out postgres:// URLs
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            url = "postgresql+psycopg://" + url[len(prefix):]
    return url


class Settings:
    on_vercel: bool = ON_VERCEL
    database_url: str = _db_url()
    # Set JWT_SECRET in production. If it is missing on Vercel, derive a stable secret from the (private) database URL.
    jwt_secret: str = os.getenv("JWT_SECRET") or (
        __import__("hashlib").sha256(("jwt:" + _db_url()).encode()).hexdigest() if ON_VERCEL
        else "dev-only-secret-change-me-in-production-0123456789")
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = int(os.getenv("JWT_EXPIRE_DAYS", "7"))
    cors_origins: list[str] = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if o.strip()]
    public_api_url_set: bool = bool(os.getenv("PUBLIC_API_URL"))
    public_api_url: str = os.getenv("PUBLIC_API_URL", f"https://{_vercel_host}" if _vercel_host else "http://localhost:8000").rstrip("/")
    seed_on_startup: bool = _bool("SEED_ON_STARTUP", True)
    max_upload_mb: int = int(os.getenv("MAX_UPLOAD_MB", "4"))
    demo_password: str = "password123"


settings = Settings()
