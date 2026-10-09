"""ORM -> response model conversion."""
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Activity, Booking, Conversation, Listing, Review, User
from .. import schemas as s
from .availability import ACTIVE, unavailable_ranges
from .reviews import (host_payload, rating_breakdown, rating_histogram, when_label)


def listing_out(l: Listing) -> s.ListingOut:
    return s.ListingOut(
        id=l.id, title=l.title, kind=l.kind, place=l.place, city=l.city, area=l.area, state=l.state, price=l.price,
        rating=l.rating, review_count=l.review_count, guest_favourite=l.guest_favourite,
        images=[i.url for i in l.images], max_guests=l.max_guests, bedrooms=l.bedrooms, beds=l.beds, baths=l.baths,
        amenities=[a.id for a in l.amenities], categories=[c.id for c in l.categories], host_id=l.owner_id,
        owner_id=l.owner_id, description=l.description, instant_book=l.instant_book, self_check_in=l.self_check_in,
        free_cancel=l.free_cancel, lat=l.lat, lng=l.lng, status=l.status, weekend=l.weekend_pct,
        weekly_discount=10 if "weekly" in (l.discounts or []) else 0,
        monthly_discount=15 if "monthly" in (l.discounts or []) else 0,
    )


def listing_detail(db: Session, l: Listing) -> s.ListingDetailOut:
    base = listing_out(l).model_dump()
    return s.ListingDetailOut(
        **base, host=s.HostOut(**host_payload(db, l.owner)), unavailable=unavailable_ranges(db, l.id),
        rating_breakdown=[s.RatingRow(**r) for r in rating_breakdown(db, l.id)], rating_histogram=rating_histogram(db, l.id),
    )


def listing_host(db: Session, l: Listing) -> s.ListingHostOut:
    from ..models import BlockedDate
    base = listing_out(l).model_dump()
    blocked = [d.isoformat() for (d,) in db.execute(select(BlockedDate.day).where(BlockedDate.listing_id == l.id).order_by(BlockedDate.day))]
    count = len(db.scalars(select(Booking.id).where(Booking.listing_id == l.id, Booking.status.in_(ACTIVE))).all())
    return s.ListingHostOut(**base, address=l.address, pin=l.pin, precise_location=l.precise_location,
                            discounts=l.discounts or [], safety=l.safety or [], camera_note=l.camera_note,
                            business_host=l.business_host, host_blocked=blocked, booking_count=count)


def booking_out(b: Booking, today: date | None = None) -> s.BookingOut:
    today = today or date.today()
    l = b.listing
    reviewed = b.review is not None
    return s.BookingOut(
        id=b.id, code=b.code, listing_id=b.listing_id, user_id=b.guest_id,
        guest_name=f"{b.guest.first_name} {b.guest.last_name}".strip(), check_in=b.check_in, check_out=b.check_out,
        adults=b.adults, children=b.children, infants=b.infants, pets=b.pets, nights=b.nights, nightly=b.nightly,
        subtotal=b.subtotal, discount_amount=b.discount_amount, discount_type=b.discount_type, cleaning=b.cleaning_fee,
        service=b.service_fee, total=b.total, status=b.status, created_at=b.created_at.isoformat(),
        listing=s.ListingBrief(id=l.id, title=l.title, kind=l.kind, area=l.area, city=l.city,
                               image=l.images[0].url if l.images else "", instant_book=l.instant_book, free_cancel=l.free_cancel),
        reviewed=reviewed, can_review=(b.status == "confirmed" and b.check_out <= today and not reviewed),
    )


def review_out(r: Review) -> s.ReviewOut:
    return s.ReviewOut(id=r.id, name=r.author_name, avatar=r.author_avatar, since=r.author_since,
                       when=when_label(r.created_at), stars=r.stars, text=r.text)


def activity_out(a: Activity) -> s.ActivityOut:
    return s.ActivityOut(id=a.id, kind=a.kind, title=a.title, city=a.city, price=a.price, unit=a.unit, rating=a.rating,
                         image=a.image, badge=a.badge, when=a.when_label, section=a.section, category=a.category,
                         minimum=a.minimum, location=a.location, coming_soon=a.coming_soon, host=a.host_name,
                         duration=a.duration, description=a.description)


def user_out(u: User) -> s.UserOut:
    return s.UserOut(id=u.id, first_name=u.first_name, last_name=u.last_name, email=u.email, dob=u.dob,
                     avatar_url=u.avatar_url, is_host=u.is_host, profile=s.ProfileData(**(u.profile or {})),
                     created_at=u.created_at.isoformat())


def conversation_out(c: Conversation, viewer_id: str) -> s.ConversationOut:
    msgs = []
    for m in c.messages:
        mine_host = m.sender_id == c.host_id
        msgs.append(s.MessageOut(id=str(m.id), sender_id=m.sender_id, **{"from": "host" if mine_host else "guest"},
                                 name="You" if m.sender_id == viewer_id else (c.guest.first_name if not mine_host else "Host"),
                                 text=m.text, at=m.created_at.isoformat()))
    return s.ConversationOut(id=c.id, guest=f"{c.guest.first_name} {c.guest.last_name}".strip(), guest_id=c.guest_id,
                             listing_id=c.listing_id, listing_title=c.listing.title, messages=msgs)
