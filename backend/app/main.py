"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import activities, auth, bookings, conversations, host, listings, meta, uploads, wishlist
from . import models  # noqa: F401  (registers tables)


def init_db() -> None:
    Base.metadata.create_all(engine)
    if settings.seed_on_startup:
        from .seed import seed_if_empty
        seed_if_empty()


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not settings.on_vercel:
        init_db()
    yield


if settings.on_vercel:   # serverless: no reliable lifespan, initialise once per cold start
    init_db()


app = FastAPI(
    title="Airbnb Clone API",
    version="1.0.0",
    description="Search, availability, bookings, reviews, wishlists and host tools for the Airbnb clone. "
                "Demo accounts use the password `password123` (see README).",
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_origin_regex=r"https://.*\.vercel\.app", allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

for r in (auth.router, listings.router, bookings.router, host.router, wishlist.router, activities.router,
          conversations.router, meta.router, uploads.router):
    app.include_router(r, prefix="/api")

app.include_router(uploads.files_router)


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}
