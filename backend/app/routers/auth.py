from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db, get_write_db
from ..models import User
from ..schemas import AuthOut, Camel, CheckEmailIn, DemoLoginIn, LoginIn, SignupIn, UserOut, UserUpdate
from ..security import create_token, current_user, hash_password, verify_password
from ..services.serializers import user_out

router = APIRouter(prefix="/auth", tags=["auth"])


class ExistsOut(Camel):
    exists: bool


@router.post("/check", response_model=ExistsOut)
def check_email(body: CheckEmailIn, db: Session = Depends(get_db)):
    """First step of 'Log in or sign up': does an account exist for this email?"""
    email = body.email.strip().lower()
    return ExistsOut(exists=db.scalar(select(func.count()).select_from(User).where(User.email == email)) > 0)


@router.post("/signup", response_model=AuthOut, status_code=201)
def signup(body: SignupIn, db: Session = Depends(get_write_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(409, "An account with this email already exists. Try logging in.")
    user = User(email=body.email, password_hash=hash_password(body.password), first_name=body.first_name,
                last_name=body.last_name, dob=body.dob, profile={})
    db.add(user)
    db.commit()
    return AuthOut(token=create_token(user.id), user=user_out(user))


@router.post("/login", response_model=AuthOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return AuthOut(token=create_token(user.id), user=user_out(user))


@router.post("/demo", response_model=AuthOut)
def demo_login(body: DemoLoginIn, db: Session = Depends(get_write_db)):
    """Mocked social sign-in (Google/Apple buttons): signs in a throw-away demo account."""
    provider = "".join(c for c in body.provider.lower() if c.isalpha())[:12] or "google"
    email = f"demo.{provider}@example.com"
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(email=email, password_hash=hash_password(settings.demo_password), first_name="Demo",
                    last_name="Guest", profile={})
        db.add(user)
        db.commit()
    return AuthOut(token=create_token(user.id), user=user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user_out(user)


@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdate, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    u = db.get(User, user.id)
    data = body.model_dump(exclude_unset=True)
    if "first_name" in data and data["first_name"]:
        u.first_name = data["first_name"].strip()
    if "last_name" in data and data["last_name"] is not None:
        u.last_name = data["last_name"].strip()
    if "avatar_url" in data:
        u.avatar_url = data["avatar_url"] or None
    if body.profile is not None:
        u.profile = body.profile.model_dump()
    db.commit()
    return user_out(u)


@router.post("/me/become-host", response_model=UserOut)
def become_host(user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    u = db.get(User, user.id)
    u.is_host = True
    db.commit()
    return user_out(u)
