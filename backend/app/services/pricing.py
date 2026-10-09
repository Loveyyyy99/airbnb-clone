"""Price breakdown: nightly rate x nights, one best discount, cleaning fee, service fee.

All money is whole INR. The same function is used by the quote endpoint and by
booking creation, so the price a guest sees is the price that is stored.
"""
from dataclasses import dataclass
from datetime import date, timedelta

from ..models import Listing

SERVICE_FEE_RATE = 0.14
DISCOUNT_LABELS = {
    "new": "New listing promotion",
    "last": "Last-minute discount",
    "weekly": "Weekly discount",
    "monthly": "Monthly discount",
}
DISCOUNT_PCT = {"new": 20, "last": 3, "weekly": 10, "monthly": 15}


@dataclass
class Quote:
    nights: int
    nightly_avg: int
    subtotal: int
    discount_type: str | None
    discount_label: str | None
    discount_pct: int
    discount_amount: int
    cleaning_fee: int
    service_fee: int
    total: int


def nightly_rates(listing: Listing, check_in: date, check_out: date) -> list[int]:
    """Fri/Sat nights carry the host's weekend adjustment."""
    out = []
    d = check_in
    while d < check_out:
        weekend = d.weekday() in (4, 5)
        out.append(round(listing.price * (1 + listing.weekend_pct / 100)) if weekend else listing.price)
        d += timedelta(days=1)
    return out


def cleaning_fee(price: int) -> int:
    return round(price * 0.18 / 10) * 10 + 250


def best_discount(listing: Listing, nights: int, check_in: date, today: date, active_bookings: int) -> str | None:
    """Only one discount applies per stay - the one with the highest percentage."""
    enabled = set(listing.discounts or [])
    candidates = []
    if "new" in enabled and active_bookings < 3:
        candidates.append("new")
    if "last" in enabled and 0 <= (check_in - today).days <= 14:
        candidates.append("last")
    if "weekly" in enabled and nights >= 7:
        candidates.append("weekly")
    if "monthly" in enabled and nights >= 28:
        candidates.append("monthly")
    return max(candidates, key=lambda k: DISCOUNT_PCT[k], default=None)


def build_quote(listing: Listing, check_in: date, check_out: date, today: date, active_bookings: int) -> Quote:
    rates = nightly_rates(listing, check_in, check_out)
    nights = len(rates)
    subtotal = sum(rates)
    dtype = best_discount(listing, nights, check_in, today, active_bookings)
    pct = DISCOUNT_PCT[dtype] if dtype else 0
    discount = round(subtotal * pct / 100)
    cleaning = cleaning_fee(listing.price)
    service = round((subtotal - discount + cleaning) * SERVICE_FEE_RATE)
    return Quote(
        nights=nights,
        nightly_avg=round(subtotal / nights) if nights else listing.price,
        subtotal=subtotal,
        discount_type=dtype,
        discount_label=DISCOUNT_LABELS.get(dtype) if dtype else None,
        discount_pct=pct,
        discount_amount=discount,
        cleaning_fee=cleaning,
        service_fee=service,
        total=subtotal - discount + cleaning + service,
    )
