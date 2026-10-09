import secrets

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db, get_write_db
from ..models import UploadedFile, User
from ..schemas import UploadOut
from ..security import current_user

router = APIRouter(prefix="/uploads", tags=["uploads"])
# Public file server (mounted at /uploads, outside /api, so URLs stay short)
files_router = APIRouter(tags=["uploads"])

SIGNATURES = [(b"\xff\xd8\xff", "jpg"), (b"\x89PNG\r\n\x1a\n", "png"), (b"GIF8", "gif")]
TYPES = {"jpg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}


def _ext(head: bytes) -> str | None:
    for sig, ext in SIGNATURES:
        if head.startswith(sig):
            return ext
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def _base_url(request: Request) -> str:
    if settings.public_api_url_set:
        return settings.public_api_url
    base = str(request.base_url).rstrip("/")
    return base.replace("http://", "https://", 1) if settings.on_vercel else base


@router.post("", response_model=UploadOut, status_code=201)
async def upload(request: Request, file: UploadFile = File(...), user: User = Depends(current_user),
                 db: Session = Depends(get_write_db)):
    """Stores an image in the database (persistent everywhere) and returns its public URL."""
    limit = settings.max_upload_mb * 1024 * 1024
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise HTTPException(413, f"Images must be under {settings.max_upload_mb} MB")
    ext = _ext(data[:16])
    if not ext:   # trust the bytes, not the filename or content-type header
        raise HTTPException(415, "Please upload a JPG, PNG, WebP or GIF image")
    name = f"{secrets.token_hex(12)}.{ext}"
    db.add(UploadedFile(name=name, content_type=TYPES[ext], data=data, owner_id=user.id))
    db.commit()
    return UploadOut(url=f"{_base_url(request)}/uploads/{name}")


@files_router.get("/uploads/{name}", include_in_schema=False)
def serve(name: str, db: Session = Depends(get_db)):
    f = db.get(UploadedFile, name)
    if not f:
        raise HTTPException(404, "File not found")
    return Response(f.data, media_type=f.content_type, headers={"Cache-Control": "public, max-age=31536000, immutable"})
