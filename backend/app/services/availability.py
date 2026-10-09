"""Availability rules.

A night is unavailable when it is blocked by the host or falls inside a pending/confirmed
booking. Cancelled and declined bookings release their dates.
"""
from datetime import date, timedelta

from sqlalchemy import and_, exists, select
from sqlalchemy.orm import Session

from ..models import BlockedDate, Booking, Listing

ACTIVE = ("pending", "confirmed")


def overlapping_booking_clause(check_in: date, check_out: date):
    """Booking rows whose [check_in, check_out) overlaps the requested range."""
    return and_(Booking.status.in_(ACTIVE), Booking.check_in < check_out, Booking.check_out > check_in)


def is_available(db: Session, listing_id: str, check_in: date, check_out: date) -> bool:
    booked = db.scalar(select(exists().where(Booking.listing_id == listing_id, overlapping_booking_clause(check_in, check_out))))
    if booked:
        return False
    blocked = db.scalar(select(exists().where(
        BlockedDate.listing_id == listing_id, BlockedDate.day >= check_in, BlockedDate.day < check_out)))
    return not blocked


def unavailable_ranges(db: Session, listing_id: str, from_day: date | None = None) -> list[list[str]]:
    """Merged [start, end) ranges the calendar should grey out. No guest info is exposed."""
    from_day = from_day or date.today()
    rows = db.execute(select(Booking.check_in, Booking.check_out).where(
        Booking.listing_id == listing_id, Booking.status.in_(ACTIVE), Booking.check_out > from_day)).all()
    ranges = [(a, b) for a, b in rows]
    for (d,) in db.execute(select(BlockedDate.day).where(BlockedDate.listing_id == listing_id, BlockedDate.day >= from_day)):
        ranges.append((d, d + timedelta(days=1)))
    ranges.sort()
    merged: list[list[date]] = []
    for a, b in ranges:
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    return [[a.isoformat(), b.isoformat()] for a, b in merged]


def active_booking_count(db: Session, listing_id: str) -> int:
    return len(db.scalars(select(Booking.id).where(Booking.listing_id == listing_id, Booking.status.in_(ACTIVE))).all())
