"""Review aggregation (listing rating, category breakdown, host superhost status)."""
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Listing, Review, User

TOPICS = {
    "View": ["view", "scenic", "mountain"],
    "Hospitality": ["host", "friendly", "hospitality", "helpful"],
    "Location": ["location", "close", "near"],
    "Value": ["value", "money"],
    "Parking": ["parking"],
    "Comfort": ["comfort", "cosy", "cozy", "bed"],
    "Condition": ["clean", "maintained"],
    "Indoor spaces": ["kitchen", "living", "indoor"],
}
BREAKDOWN = [("Cleanliness", "cleanliness", "🧼"), ("Accuracy", "accuracy", "✔️"), ("Check-in", "checkin", "🔑"),
             ("Communication", "communication", "💬"), ("Location", "location", "🗺️")]


def recompute_listing_rating(db: Session, listing: Listing) -> None:
    avg, cnt = db.execute(select(func.avg(Review.stars), func.count(Review.id)).where(Review.listing_id == listing.id)).one()
    listing.review_count = cnt or 0
    listing.rating = round(float(avg), 2) if cnt else 0.0


def rating_breakdown(db: Session, listing_id: str) -> list[dict]:
    cols = [func.avg(getattr(Review, c)) for _, c, _ in BREAKDOWN]
    row = db.execute(select(*cols).where(Review.listing_id == listing_id)).one()
    out = []
    for (label, _, icon), v in zip(BREAKDOWN, row):
        out.append({"label": label, "value": f"{float(v):.1f}" if v is not None else "—", "icon": icon})
    return out


def rating_histogram(db: Session, listing_id: str) -> list[int]:
    rows = dict(db.execute(select(Review.stars, func.count()).where(Review.listing_id == listing_id).group_by(Review.stars)).all())
    return [rows.get(s, 0) for s in (5, 4, 3, 2, 1)]


def when_label(created: datetime, today: date | None = None) -> str:
    today = today or date.today()
    days = (today - created.date()).days
    if days <= 0:
        return "Today"
    if days < 7:
        return f"{days} day{'s' if days > 1 else ''} ago"
    if days < 30:
        w = days // 7
        return f"{w} week{'s' if w > 1 else ''} ago"
    return created.strftime("%B %Y")


def tenure_label(created: datetime, today: date | None = None) -> str:
    today = today or date.today()
    months = max(1, (today.year - created.year) * 12 + today.month - created.month)
    if months < 12:
        return f"{months} month{'s' if months > 1 else ''}"
    y = months // 12
    return f"{y} year{'s' if y > 1 else ''}"


def host_stats(db: Session, owner_ids: list[str]) -> dict[str, tuple[int, float]]:
    """owner_id -> (total reviews, review-weighted average rating) across all their listings."""
    rows = db.execute(select(Listing.owner_id, func.sum(Listing.review_count), func.sum(Listing.review_count * Listing.rating))
                      .where(Listing.owner_id.in_(owner_ids)).group_by(Listing.owner_id)).all()
    out = {}
    for oid, cnt, weighted in rows:
        cnt = int(cnt or 0)
        out[oid] = (cnt, round(float(weighted or 0) / cnt, 2) if cnt else 0.0)
    return out


def is_superhost(reviews: int, rating: float) -> bool:
    return reviews >= 20 and rating >= 4.8


def host_payload(db: Session, user: User) -> dict:
    reviews, rating = host_stats(db, [user.id]).get(user.id, (0, 0.0))
    return {
        "id": user.id, "name": user.first_name, "superhost": is_superhost(reviews, rating),
        "years": tenure_label(user.created_at), "avatar": user.avatar_url, "reviews": reviews, "rating": rating,
        "about": "Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests."
                 if is_superhost(reviews, rating) else "Your host is happy to help with anything you need during your stay.",
    }
