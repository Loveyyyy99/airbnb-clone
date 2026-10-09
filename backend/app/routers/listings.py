from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Listing, Review, User
from ..schemas import (CountOut, DiscountOut, ListingDetailOut, ListingOut, ListingPage, MapPoint, QuoteOut, ReviewPage)
from ..security import optional_user
from ..services import search as search_service
from ..services.availability import active_booking_count
from ..services.booking_rules import stay_problem
from ..services.pricing import build_quote
from ..services.reviews import TOPICS
from ..services.serializers import listing_detail, listing_out, review_out

router = APIRouter(prefix="/listings", tags=["listings"])
LOAD = (selectinload(Listing.images), selectinload(Listing.amenities), selectinload(Listing.categories))


def _csv(v: str | None) -> list[str]:
    return [x.strip() for x in (v or "").split(",") if x.strip()]


def search_params(
    where: str = "", checkIn: date | None = None, checkOut: date | None = None,
    adults: int = Query(0, ge=0, le=16), children: int = Query(0, ge=0, le=15),
    infants: int = Query(0, ge=0, le=5), pets: int = Query(0, ge=0, le=5),
    category: str = "all", minPrice: int = Query(0, ge=0), maxPrice: int | None = Query(None, ge=0),
    place: str = Query("any", pattern="^(any|room|entire)$"),
    bedrooms: int = Query(0, ge=0, le=20), beds: int = Query(0, ge=0, le=30), baths: int = Query(0, ge=0, le=20),
    kinds: str | None = None, amenities: str | None = None,
    instantBook: bool = False, selfCheckIn: bool = False, freeCancel: bool = False, favourite: bool = False,
    sort: str = Query("recommended", pattern="^(recommended|low|high|rating)$"),
) -> search_service.SearchParams:
    if (checkIn is None) != (checkOut is None):
        checkIn = checkOut = None  # a half-selected range is ignored, like the UI does
    if checkIn and checkOut and checkOut <= checkIn:
        raise HTTPException(422, "checkOut must be after checkIn")
    return search_service.SearchParams(
        where=where, check_in=checkIn, check_out=checkOut, adults=adults, children=children, infants=infants, pets=pets,
        category=category, min_price=minPrice, max_price=maxPrice, place=place, bedrooms=bedrooms, beds=beds, baths=baths,
        kinds=_csv(kinds), amenities=_csv(amenities), instant_book=instantBook, self_check_in=selfCheckIn,
        free_cancel=freeCancel, favourite=favourite, sort=sort)


@router.get("", response_model=ListingPage)
def list_listings(p: search_service.SearchParams = Depends(search_params), page: int = Query(1, ge=1),
                  pageSize: int = Query(12, ge=1, le=48), db: Session = Depends(get_db)):
    rows, total = search_service.search(db, p, page, pageSize)
    ids = [r.id for r in rows]
    full = {l.id: l for l in db.scalars(select(Listing).where(Listing.id.in_(ids)).options(*LOAD))} if ids else {}
    items = [listing_out(full[i]) for i in ids]
    return ListingPage(items=items, total=total, page=page, page_size=pageSize, has_more=page * pageSize < total)


@router.get("/count", response_model=CountOut)
def count_listings(p: search_service.SearchParams = Depends(search_params), db: Session = Depends(get_db)):
    """Powers the 'Show N places' button in the filters modal."""
    return CountOut(total=search_service.count(db, p))


@router.get("/map", response_model=list[MapPoint])
def map_points(p: search_service.SearchParams = Depends(search_params), db: Session = Depends(get_db)):
    return [MapPoint(id=r.id, lat=r.lat, lng=r.lng, price=r.price) for r in search_service.map_points(db, p)]


@router.get("/collections", response_model=dict[str, list[ListingOut]])
def collections(cities: str, limit: int = Query(7, ge=1, le=24), db: Session = Depends(get_db)):
    """Rows for the explore pages: {city: first N listings in that city}."""
    out: dict[str, list[ListingOut]] = {}
    for city in _csv(cities)[:12]:
        rows = db.scalars(select(Listing).where(Listing.city == city, Listing.status == "published")
                          .order_by(Listing.rank, Listing.id).limit(limit).options(*LOAD)).all()
        out[city] = [listing_out(l) for l in rows]
    return out


def _published_or_owner(db: Session, listing_id: str, user: User | None) -> Listing:
    l = db.scalar(select(Listing).where(Listing.id == listing_id).options(*LOAD))
    if not l or (l.status != "published" and (not user or user.id != l.owner_id)):
        raise HTTPException(404, "This listing isn't available")
    return l


@router.get("/{listing_id}", response_model=ListingDetailOut)
def listing_detail_route(listing_id: str, db: Session = Depends(get_db), user: User | None = Depends(optional_user)):
    return listing_detail(db, _published_or_owner(db, listing_id, user))


@router.get("/{listing_id}/quote", response_model=QuoteOut)
def quote(listing_id: str, checkIn: date, checkOut: date, adults: int = Query(1, ge=0, le=16),
          children: int = Query(0, ge=0, le=15), infants: int = Query(0, ge=0, le=5), pets: int = Query(0, ge=0, le=5),
          db: Session = Depends(get_db), user: User | None = Depends(optional_user)):
    """Server-side price breakdown + availability for a date range."""
    l = _published_or_owner(db, listing_id, user)
    problem = stay_problem(db, l, checkIn, checkOut, adults, children, pets)
    if problem and problem[1] in ("Checkout must be after check-in",):
        raise HTTPException(*problem)
    if problem and problem[0] == 409:
        return QuoteOut(available=False, reason=problem[1])
    q = build_quote(l, checkIn, checkOut, date.today(), active_booking_count(db, l.id))
    disc = DiscountOut(type=q.discount_type, label=q.discount_label, pct=q.discount_pct, amount=q.discount_amount) if q.discount_type else None
    return QuoteOut(available=problem is None, reason=problem[1] if problem else None, nights=q.nights, nightly_avg=q.nightly_avg,
                    subtotal=q.subtotal, discount=disc, cleaning_fee=q.cleaning_fee, service_fee=q.service_fee, total=q.total)


@router.get("/{listing_id}/reviews", response_model=ReviewPage)
def reviews(listing_id: str, page: int = Query(1, ge=1), pageSize: int = Query(6, ge=1, le=50), topic: str | None = None,
            db: Session = Depends(get_db)):
    if not db.get(Listing, listing_id):
        raise HTTPException(404, "This listing isn't available")
    cond = [Review.listing_id == listing_id]
    if topic:
        words = TOPICS.get(topic, [topic.lower()])
        from sqlalchemy import or_
        cond.append(or_(*[func.lower(Review.text).like(f"%{w}%") for w in words]))
    total = db.scalar(select(func.count()).select_from(Review).where(*cond)) or 0
    rows = db.scalars(select(Review).where(*cond).order_by(Review.created_at.desc(), Review.id.desc())
                      .limit(pageSize).offset((page - 1) * pageSize)).all()
    return ReviewPage(items=[review_out(r) for r in rows], total=total, page=page, page_size=pageSize, has_more=page * pageSize < total)


@router.get("/{listing_id}/nearby", response_model=list[ListingOut])
def nearby(listing_id: str, limit: int = Query(7, ge=1, le=24), db: Session = Depends(get_db)):
    l = db.get(Listing, listing_id)
    if not l:
        raise HTTPException(404, "This listing isn't available")
    rows = db.scalars(select(Listing).where(Listing.city == l.city, Listing.id != l.id, Listing.status == "published")
                      .order_by(Listing.rank, Listing.id).limit(limit).options(*LOAD)).all()
    return [listing_out(x) for x in rows]
