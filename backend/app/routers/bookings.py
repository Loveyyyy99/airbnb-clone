import secrets
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db, get_write_db
from ..models import Booking, Conversation, Listing, Message, Review, User
from ..schemas import BookingCreate, BookingOut, ReviewCreate, ReviewOut
from ..security import current_user
from ..services.availability import active_booking_count
from ..services.booking_rules import stay_problem
from ..services.pricing import build_quote
from ..services.reviews import recompute_listing_rating, tenure_label
from ..services.serializers import booking_out, review_out

router = APIRouter(prefix="/bookings", tags=["bookings"])
BOOKING_LOAD = (selectinload(Booking.listing).selectinload(Listing.images), selectinload(Booking.guest), selectinload(Booking.review))


def _code(db: Session) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        c = "".join(secrets.choice(alphabet) for _ in range(6))
        if not db.scalar(select(Booking.id).where(Booking.code == c)):
            return c


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    """Create a booking. Runs inside BEGIN IMMEDIATE, so the availability check and the insert are atomic."""
    listing = db.scalar(select(Listing).where(Listing.id == body.listing_id).options(selectinload(Listing.amenities), selectinload(Listing.images)).with_for_update())
    if not listing or listing.status != "published":
        raise HTTPException(404, "This listing isn't available")
    if listing.owner_id == user.id:
        raise HTTPException(422, "You can't book your own listing")
    problem = stay_problem(db, listing, body.check_in, body.check_out, body.adults, body.children, body.pets)
    if problem:
        raise HTTPException(*problem)
    q = build_quote(listing, body.check_in, body.check_out, date.today(), active_booking_count(db, listing.id))
    booking = Booking(
        code=_code(db), listing_id=listing.id, guest_id=user.id, check_in=body.check_in, check_out=body.check_out,
        adults=body.adults, children=body.children, infants=body.infants, pets=body.pets, nights=q.nights,
        nightly=q.nightly_avg, subtotal=q.subtotal, discount_type=q.discount_type, discount_amount=q.discount_amount,
        cleaning_fee=q.cleaning_fee, service_fee=q.service_fee, total=q.total,
        status="confirmed" if listing.instant_book else "pending", payment_method=body.payment_method)
    db.add(booking)
    if body.message and body.message.strip():
        conv = db.scalar(select(Conversation).where(Conversation.listing_id == listing.id, Conversation.guest_id == user.id))
        if not conv:
            conv = Conversation(listing_id=listing.id, host_id=listing.owner_id, guest_id=user.id)
            db.add(conv)
            db.flush()
        db.add(Message(conversation_id=conv.id, sender_id=user.id, text=body.message.strip()))
    db.commit()
    b = db.scalar(select(Booking).where(Booking.id == booking.id).options(*BOOKING_LOAD))
    return booking_out(b)


@router.get("/mine", response_model=list[BookingOut])
def my_bookings(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Booking).where(Booking.guest_id == user.id).order_by(Booking.check_in.desc())
                      .options(*BOOKING_LOAD)).all()
    return [booking_out(b) for b in rows]


def _own_booking(db: Session, booking_id: str, user: User) -> Booking:
    b = db.scalar(select(Booking).where(Booking.id == booking_id).options(*BOOKING_LOAD))
    if not b or b.guest_id != user.id:
        raise HTTPException(404, "Reservation not found")
    return b


@router.get("/{booking_id}", response_model=BookingOut)
def get_booking(booking_id: str, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return booking_out(_own_booking(db, booking_id, user))


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: str, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    b = _own_booking(db, booking_id, user)
    if b.status not in ("pending", "confirmed"):
        raise HTTPException(409, "This reservation is already cancelled")
    if b.check_out < date.today():
        raise HTTPException(422, "Past stays can't be cancelled")
    b.status = "cancelled"  # releases the dates: availability only considers pending/confirmed
    db.commit()
    return booking_out(b)


@router.post("/{booking_id}/review", response_model=ReviewOut, status_code=201)
def leave_review(booking_id: str, body: ReviewCreate, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    """A guest can review a stay once, after checkout."""
    b = _own_booking(db, booking_id, user)
    if b.status != "confirmed" or b.check_out > date.today():
        raise HTTPException(422, "You can review a stay after you've checked out")
    if b.review is not None:
        raise HTTPException(409, "You've already reviewed this stay")
    review = Review(listing_id=b.listing_id, booking_id=b.id, author_id=user.id, author_name=user.first_name,
                    author_avatar=user.avatar_url, author_since=f"{tenure_label(user.created_at)} on Airbnb",
                    stars=body.stars, cleanliness=body.stars, accuracy=body.stars, checkin=body.stars,
                    communication=body.stars, location=body.stars, text=body.text.strip())
    db.add(review)
    db.flush()
    listing = db.get(Listing, b.listing_id)
    recompute_listing_rating(db, listing)
    db.commit()
    return review_out(review)
