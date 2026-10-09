"""Create/update listings from wizard or editor payloads."""
import secrets

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Amenity, Category, Listing, ListingImage, User
from ..schemas import ListingWrite
from .geo import categories_for, coords_for

KIND_MAP = {"House": "Home", "Flat/apartment": "Flat"}


def apply_write(db: Session, listing: Listing, w: ListingWrite) -> None:
    amenity_ids = list(dict.fromkeys(w.amenities))
    found = db.scalars(select(Amenity).where(Amenity.id.in_(amenity_ids))).all() if amenity_ids else []
    missing = set(amenity_ids) - {a.id for a in found}
    if missing:
        raise HTTPException(422, f"Unknown amenity: {sorted(missing)[0]}")
    kind = KIND_MAP.get(w.kind, w.kind)
    lat, lng = (w.lat, w.lng) if w.lat is not None and w.lng is not None else coords_for(w.city, w.address or w.city)
    listing.title = w.title.strip()
    listing.kind = kind
    listing.place = w.place
    listing.description = w.description.strip() or "A lovely place to stay."
    listing.address = w.address
    listing.city = w.city.strip()
    listing.state = w.state.strip() or listing.state or ""
    listing.area = (w.area.strip() or w.city.strip())
    listing.pin = w.pin
    listing.precise_location = w.precise_location
    listing.lat, listing.lng = lat, lng
    listing.price = w.price
    listing.weekend_pct = w.weekend
    listing.max_guests = w.max_guests
    listing.bedrooms, listing.beds, listing.baths = w.bedrooms, w.beds, w.baths
    listing.instant_book = w.instant_book
    listing.self_check_in = w.self_check_in
    listing.free_cancel = w.free_cancel
    listing.discounts = list(dict.fromkeys(w.discounts))
    listing.safety = w.safety
    listing.camera_note = w.camera_note
    listing.business_host = w.business_host
    listing.amenities = list(found)
    cat_ids = categories_for(listing.city, w.place, w.price, kind)
    listing.categories = list(db.scalars(select(Category).where(Category.id.in_(cat_ids))).all())
    listing.images = [ListingImage(url=u, position=i) for i, u in enumerate(w.photos)]


def create_listing(db: Session, owner: User, w: ListingWrite) -> Listing:
    min_rank = db.scalar(select(func.min(Listing.rank))) or 0
    listing = Listing(id=f"lst_{secrets.token_hex(5)}", owner_id=owner.id, rank=min_rank - 1, status="published",
                      rating=0.0, review_count=0, guest_favourite=False)
    apply_write(db, listing, w)
    db.add(listing)
    owner.is_host = True
    return listing


DRAFT_KEYS = ("title", "description", "address", "city", "state", "area", "pin", "price")


def draft_to_write(data: dict) -> ListingWrite:
    """Map the wizard's draft JSON to a validated ListingWrite (raises 422 with a readable message)."""
    photos = data.get("photos") or []
    if len(photos) < 5:
        raise HTTPException(422, "Add at least 5 photos to publish your listing")
    if not str(data.get("title", "")).strip():
        raise HTTPException(422, "Give your place a title")
    if not str(data.get("description", "")).strip():
        raise HTTPException(422, "Add a description")
    if data.get("business") is None:
        raise HTTPException(422, "Tell us if you're hosting as a business")
    street = str(data.get("street", "")).strip()
    if not street or not str(data.get("city", "")).strip() or not str(data.get("state", "")).strip():
        raise HTTPException(422, "Street address, city and state are required")
    if not str(data.get("pin", "")).isdigit() or len(str(data.get("pin"))) != 6:
        raise HTTPException(422, "Enter a valid 6-digit PIN code")
    try:
        return ListingWrite(
            title=str(data["title"]).strip()[:50], kind=data.get("kind", "House"), place=data.get("place", "entire"),
            description=str(data["description"])[:500], address=data.get("address"), city=data["city"],
            state=data.get("state", ""), area=data.get("area", "") or data["city"], pin=data.get("pin"),
            precise_location=bool(data.get("precise", False)), price=int(data.get("price", 0)),
            weekend=int(data.get("weekend", 0)), max_guests=int(data.get("guests", 2)),
            bedrooms=int(data.get("bedrooms", 1)), beds=int(data.get("beds", 1)), baths=int(data.get("baths", 1)),
            amenities=data.get("amenities", []), photos=photos, instant_book=bool(data.get("instantBook", False)),
            discounts=[d for d in data.get("discounts", []) if d in {"new", "last", "weekly", "monthly"}],
            safety=data.get("safety", []), camera_note=data.get("cameraNote") or None, business_host=data.get("business"),
        )
    except (ValueError, TypeError) as e:  # pydantic ValidationError is a ValueError
        msg = getattr(e, "errors", lambda: None)()
        detail = msg[0]["msg"] if msg else str(e)
        raise HTTPException(422, detail)
