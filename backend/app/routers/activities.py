import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db, get_write_db
from ..models import Activity, ActivityBooking, User
from ..schemas import ActivityBookingCreate, ActivityBookingOut, ActivityOut, ActivityPage
from ..security import current_user
from ..services.serializers import activity_out

router = APIRouter(tags=["experiences & services"])
ALIAS = {"gurugram": ["delhi", "agra"], "gurgaon district": ["delhi", "agra"], "north goa": ["goa"]}


def _booking_out(b: ActivityBooking) -> ActivityBookingOut:
    return ActivityBookingOut(id=b.id, code=b.code, day=b.day, guests=b.guests, total=b.total, status=b.status,
                              created_at=b.created_at.isoformat(), activity=activity_out(b.activity))


@router.get("/activities", response_model=ActivityPage)
def list_activities(kind: str = Query(..., pattern="^(experience|service)$"), where: str = "", type: str | None = None,
                    db: Session = Depends(get_db)):
    q = select(Activity).where(Activity.kind == kind)
    head = where.split(",")[0].strip().lower()
    if head:
        terms = [head, *ALIAS.get(head, [])]
        q = q.where(or_(*[or_(func.lower(Activity.city).like(f"%{t}%"), func.lower(Activity.title).like(f"%{t}%"),
                              func.lower(func.coalesce(Activity.location, "")).like(f"%{t}%")) for t in terms]))
    if type:
        q = q.where(Activity.category == type)
    rows = db.scalars(q.order_by(Activity.rank)).all()
    return ActivityPage(items=[activity_out(a) for a in rows], total=len(rows))


@router.get("/activities/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: str, db: Session = Depends(get_db)):
    a = db.get(Activity, activity_id)
    if not a:
        raise HTTPException(404, "We couldn't find that")
    return activity_out(a)


@router.post("/activity-bookings", response_model=ActivityBookingOut, status_code=201)
def book_activity(body: ActivityBookingCreate, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    a = db.get(Activity, body.activity_id)
    if not a:
        raise HTTPException(404, "We couldn't find that")
    if a.coming_soon:
        raise HTTPException(422, "This Original is coming soon")
    if body.day < date.today():
        raise HTTPException(422, "Choose a date in the future")
    total = max(a.price if a.unit == "group" else a.price * body.guests, a.minimum or 0)
    while True:
        code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
        if not db.scalar(select(ActivityBooking.id).where(ActivityBooking.code == code)):
            break
    b = ActivityBooking(code=code, activity_id=a.id, user_id=user.id, day=body.day, guests=body.guests, total=total)
    db.add(b)
    db.commit()
    return _booking_out(b)


@router.get("/activity-bookings/mine", response_model=list[ActivityBookingOut])
def my_activity_bookings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(ActivityBooking).where(ActivityBooking.user_id == user.id).order_by(ActivityBooking.day.desc())
                      .options(selectinload(ActivityBooking.activity))).all()
    return [_booking_out(b) for b in rows]
