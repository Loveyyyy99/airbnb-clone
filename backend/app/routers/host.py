import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from datetime import date, timedelta

from ..database import get_db, get_write_db
from ..models import BlockedDate, Booking, Conversation, HostDraft, Listing, User
from ..schemas import (BlockDateIn, BookingOut, ConversationOut, DraftIn, DraftOut, HostBookingAction, ListingHostOut,
                       ListingPatch, ListingWrite)
from ..security import current_user
from ..services.availability import is_available
from ..services.listing_writer import apply_write, create_listing, draft_to_write
from ..services.serializers import booking_out, conversation_out, listing_host
from .bookings import BOOKING_LOAD

router = APIRouter(prefix="/host", tags=["host"])
LOAD = (selectinload(Listing.images), selectinload(Listing.amenities), selectinload(Listing.categories))
MAX_DRAFT_BYTES = 200_000


def _mine(db: Session, listing_id: str, user: User) -> Listing:
    l = db.scalar(select(Listing).where(Listing.id == listing_id).options(*LOAD))
    if not l or l.owner_id != user.id:
        raise HTTPException(404, "Listing not found")
    return l


# ───────── listings CRUD
@router.get("/listings", response_model=list[ListingHostOut])
def my_listings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Listing).where(Listing.owner_id == user.id).order_by(Listing.created_at.desc()).options(*LOAD)).all()
    return [listing_host(db, l) for l in rows]


@router.post("/listings", response_model=ListingHostOut, status_code=201)
def create(body: ListingWrite, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    owner = db.get(User, user.id)
    listing = create_listing(db, owner, body)
    db.commit()
    return listing_host(db, _mine(db, listing.id, user))


@router.get("/listings/{listing_id}", response_model=ListingHostOut)
def get_one(listing_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return listing_host(db, _mine(db, listing_id, user))


@router.put("/listings/{listing_id}", response_model=ListingHostOut)
def replace(listing_id: str, body: ListingWrite, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    l = _mine(db, listing_id, user)
    apply_write(db, l, body)
    db.commit()
    return listing_host(db, _mine(db, listing_id, user))


@router.patch("/listings/{listing_id}", response_model=ListingHostOut)
def patch(listing_id: str, body: ListingPatch, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    l = _mine(db, listing_id, user)
    data = body.model_dump(exclude_unset=True)
    if "discounts" in data and data["discounts"] is not None:
        bad = [d for d in data["discounts"] if d not in {"new", "last", "weekly", "monthly"}]
        if bad:
            raise HTTPException(422, f"Unknown discount: {bad[0]}")
        l.discounts = data.pop("discounts")
    for key, attr in (("price", "price"), ("free_cancel", "free_cancel"), ("instant_book", "instant_book"),
                      ("weekend", "weekend_pct"), ("status", "status")):
        if data.get(key) is not None:
            setattr(l, attr, data[key])
    db.commit()
    return listing_host(db, _mine(db, listing_id, user))


@router.delete("/listings/{listing_id}", status_code=204)
def delete(listing_id: str, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    l = _mine(db, listing_id, user)
    db.query(HostDraft).filter(HostDraft.listing_id == l.id).delete()
    db.delete(l)   # cascades to images, bookings, blocked dates, reviews
    db.commit()


# ───────── calendar
@router.put("/listings/{listing_id}/blocked-dates", response_model=ListingHostOut)
def set_blocked(listing_id: str, body: BlockDateIn, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    l = _mine(db, listing_id, user)
    existing = db.scalar(select(BlockedDate).where(BlockedDate.listing_id == l.id, BlockedDate.day == body.day))
    if body.blocked:
        if body.day < date.today():
            raise HTTPException(422, "You can't block a date in the past")
        if not is_available(db, l.id, body.day, body.day + timedelta(days=1)) and not existing:
            raise HTTPException(409, "That night already has a reservation")
        if not existing:
            db.add(BlockedDate(listing_id=l.id, day=body.day))
    elif existing:
        db.delete(existing)
    db.commit()
    return listing_host(db, _mine(db, listing_id, user))


@router.get("/listings/{listing_id}/bookings", response_model=list[BookingOut])
def listing_bookings(listing_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    l = _mine(db, listing_id, user)
    rows = db.scalars(select(Booking).where(Booking.listing_id == l.id, Booking.status.in_(("pending", "confirmed")))
                      .order_by(Booking.check_in).options(*BOOKING_LOAD)).all()
    return [booking_out(b) for b in rows]


# ───────── reservations dashboard
@router.get("/bookings", response_model=list[BookingOut])
def host_bookings(scope: str = Query("all", pattern="^(all|today|upcoming)$"), listingId: str | None = None,
                  user: User = Depends(current_user), db: Session = Depends(get_db)):
    today = date.today()
    q = select(Booking).join(Listing, Listing.id == Booking.listing_id).where(Listing.owner_id == user.id)
    if listingId:
        q = q.where(Booking.listing_id == listingId)
    q = q.where(Booking.status.in_(("pending", "confirmed")))
    if scope == "today":
        q = q.where(Booking.check_in <= today, Booking.check_out >= today)
    elif scope == "upcoming":
        q = q.where(Booking.check_in > today)
    rows = db.scalars(q.order_by(Booking.check_in).options(*BOOKING_LOAD)).all()
    return [booking_out(b) for b in rows]


@router.patch("/bookings/{booking_id}", response_model=BookingOut)
def respond(booking_id: str, body: HostBookingAction, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    b = db.scalar(select(Booking).where(Booking.id == booking_id).options(*BOOKING_LOAD))
    if not b or b.listing.owner_id != user.id:
        raise HTTPException(404, "Reservation not found")
    if b.status != "pending":
        raise HTTPException(409, "Only reservation requests awaiting approval can be approved or declined")
    b.status = body.status
    db.commit()
    return booking_out(b)


# ───────── wizard draft (one per host)
def _draft_out(d: HostDraft) -> DraftOut:
    return DraftOut(id=d.id, step=d.step, listing_id=d.listing_id, data=d.data or {}, updated_at=d.updated_at.isoformat())


@router.get("/draft", response_model=DraftOut | None)
def get_draft(user: User = Depends(current_user), db: Session = Depends(get_db)):
    d = db.scalar(select(HostDraft).where(HostDraft.owner_id == user.id))
    return _draft_out(d) if d else None


@router.put("/draft", response_model=DraftOut)
def save_draft(body: DraftIn, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    if len(json.dumps(body.data)) > MAX_DRAFT_BYTES:
        raise HTTPException(413, "Draft is too large")
    if body.listing_id:
        _mine(db, body.listing_id, user)
    d = db.scalar(select(HostDraft).where(HostDraft.owner_id == user.id))
    if not d:
        d = HostDraft(owner_id=user.id)
        db.add(d)
    d.step, d.listing_id, d.data = body.step, body.listing_id, body.data
    db.commit()
    return _draft_out(d)


@router.delete("/draft", status_code=204)
def discard_draft(user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    db.query(HostDraft).filter(HostDraft.owner_id == user.id).delete()
    db.commit()


@router.post("/draft/publish", response_model=ListingHostOut, status_code=201)
def publish_draft(user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    """Validate the wizard draft, create (or update) the listing and delete the draft."""
    d = db.scalar(select(HostDraft).where(HostDraft.owner_id == user.id))
    if not d:
        raise HTTPException(404, "There's no draft to publish")
    w = draft_to_write(d.data or {})
    if d.listing_id:
        listing = _mine(db, d.listing_id, user)
        apply_write(db, listing, w)
    else:
        listing = create_listing(db, db.get(User, user.id), w)
    lid = listing.id
    db.delete(d)
    db.commit()
    return listing_host(db, _mine(db, lid, user))


# ───────── inbox
@router.get("/conversations", response_model=list[ConversationOut])
def host_conversations(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Conversation).where(Conversation.host_id == user.id).order_by(Conversation.created_at.desc())
                      .options(selectinload(Conversation.messages), selectinload(Conversation.guest), selectinload(Conversation.listing))).all()
    return [conversation_out(c, user.id) for c in rows if c.messages]
