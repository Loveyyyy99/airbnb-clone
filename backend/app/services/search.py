"""Listing search: free-text destination, availability, guests, filters, sorting."""
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import and_, exists, func, or_, select
from sqlalchemy.orm import Session

from ..models import Amenity, BlockedDate, Booking, Category, Listing, listing_amenities, listing_categories
from .availability import overlapping_booking_clause

PLACE_ALIASES = {
    "gurgaon": ["gurugram", "sector"],
    "gurgaon district": ["gurugram", "sector"],
    "mohali": ["sahibzada", "kharar"],
    "delhi": ["new delhi"],
}
KIND_GROUPS = {
    "House": ["Home"],
    "Apartment": ["Flat", "Apartment"],
    "Villa": ["Villa"],
    "Loft": ["Loft"],
    "Cabin": ["Cabin"],
    "Room": ["Room"],
}
SORTS = {"recommended", "low", "high", "rating"}


@dataclass
class SearchParams:
    where: str = ""
    check_in: date | None = None
    check_out: date | None = None
    adults: int = 0
    children: int = 0
    infants: int = 0
    pets: int = 0
    category: str = "all"
    min_price: int = 0
    max_price: int | None = None
    place: str = "any"
    bedrooms: int = 0
    beds: int = 0
    baths: int = 0
    kinds: list[str] = field(default_factory=list)
    amenities: list[str] = field(default_factory=list)
    instant_book: bool = False
    self_check_in: bool = False
    free_cancel: bool = False
    favourite: bool = False
    sort: str = "recommended"


def _where_clause(q: str):
    head = q.split(",")[0].strip().lower()
    if not head:
        return None
    terms = [head, *PLACE_ALIASES.get(head, [])]
    conds = []
    for t in terms:
        like = f"%{t}%"
        conds.append(or_(func.lower(Listing.city).like(like), func.lower(Listing.area).like(like),
                         func.lower(Listing.state).like(like), func.lower(Listing.title).like(like)))
    return or_(*conds)


def build_filters(p: SearchParams) -> list:
    f = [Listing.status == "published"]
    w = _where_clause(p.where)
    if w is not None:
        f.append(w)
    if p.check_in and p.check_out:
        f.append(~exists().where(Booking.listing_id == Listing.id, overlapping_booking_clause(p.check_in, p.check_out)))
        f.append(~exists().where(and_(BlockedDate.listing_id == Listing.id, BlockedDate.day >= p.check_in, BlockedDate.day < p.check_out)))
    guests = p.adults + p.children
    if guests:
        f.append(Listing.max_guests >= guests)
    if p.pets:
        f.append(exists().where(listing_amenities.c.listing_id == Listing.id, listing_amenities.c.amenity_id == "pets"))
    if p.category and p.category != "all":
        f.append(exists().where(listing_categories.c.listing_id == Listing.id, listing_categories.c.category_id == p.category))
    f.append(Listing.price >= p.min_price)
    if p.max_price is not None:
        f.append(Listing.price <= p.max_price)
    if p.place in ("room", "entire"):
        f.append(Listing.place == p.place)
    if p.bedrooms:
        f.append(Listing.bedrooms >= p.bedrooms)
    if p.beds:
        f.append(Listing.beds >= p.beds)
    if p.baths:
        f.append(Listing.baths >= p.baths)
    if p.kinds:
        kinds = [k for g in p.kinds for k in KIND_GROUPS.get(g, [g])]
        f.append(Listing.kind.in_(kinds))
    for a in p.amenities:
        f.append(exists().where(listing_amenities.c.listing_id == Listing.id, listing_amenities.c.amenity_id == a))
    if p.instant_book:
        f.append(Listing.instant_book.is_(True))
    if p.self_check_in:
        f.append(Listing.self_check_in.is_(True))
    if p.free_cancel:
        f.append(Listing.free_cancel.is_(True))
    if p.favourite:
        f.append(Listing.guest_favourite.is_(True))
    return f


def order_by(sort: str):
    if sort == "low":
        return [Listing.price.asc(), Listing.rank.asc()]
    if sort == "high":
        return [Listing.price.desc(), Listing.rank.asc()]
    if sort == "rating":
        return [Listing.rating.desc(), Listing.review_count.desc(), Listing.rank.asc()]
    return [Listing.rank.asc(), Listing.id.asc()]


def search(db: Session, p: SearchParams, page: int, page_size: int) -> tuple[list[Listing], int]:
    filters = build_filters(p)
    total = db.scalar(select(func.count()).select_from(Listing).where(*filters)) or 0
    rows = db.scalars(select(Listing).where(*filters).order_by(*order_by(p.sort))
                      .limit(page_size).offset((page - 1) * page_size)).all()
    return list(rows), total


def count(db: Session, p: SearchParams) -> int:
    return db.scalar(select(func.count()).select_from(Listing).where(*build_filters(p))) or 0


def map_points(db: Session, p: SearchParams, limit: int = 200):
    filters = build_filters(p)
    return db.execute(select(Listing.id, Listing.lat, Listing.lng, Listing.price).where(*filters)
                      .order_by(*order_by(p.sort)).limit(limit)).all()
