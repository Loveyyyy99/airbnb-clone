"""Validation shared by the quote endpoint and booking creation."""
from datetime import date

from sqlalchemy.orm import Session

from ..models import Listing
from .availability import is_available

MAX_NIGHTS = 365


def stay_problem(db: Session, listing: Listing, check_in: date, check_out: date,
                 adults: int, children: int, pets: int, today: date | None = None) -> tuple[int, str] | None:
    """Return (http_status, message) for the first rule the request breaks, else None."""
    today = today or date.today()
    if check_out <= check_in:
        return 422, "Checkout must be after check-in"
    if check_in < today:
        return 422, "Check-in cannot be in the past"
    if (check_out - check_in).days > MAX_NIGHTS:
        return 422, f"Stays are limited to {MAX_NIGHTS} nights"
    guests = adults + children
    if guests < 1:
        return 422, "Add at least one guest"
    if guests > listing.max_guests:
        return 422, f"This place allows up to {listing.max_guests} guests"
    if pets and not any(a.id == "pets" for a in listing.amenities):
        return 422, "Pets are not allowed at this place"
    if not is_available(db, listing.id, check_in, check_out):
        return 409, "Those dates are no longer available"
    return None
