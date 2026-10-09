"""Seed the database so the app is immediately usable.

Creates: 8 host accounts, 12 guest accounts + 1 demo guest, 88 listings with photos/amenities/categories,
real bookings on the listings (these block dates), reviews whose average matches each listing's rating,
experiences, services, a few conversations and the demo guest's trips/wishlist.

Run:  python -m app.seed            (only if the DB is empty)
      python -m app.seed --reset    (drop everything and re-seed)
Dates are relative to the day the seed runs.
"""
import json
import random
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, SessionLocal, engine
from .models import (Activity, Amenity, BlockedDate, Booking, Category, Conversation, Listing, ListingImage, Message,
                     Review, User, WishlistItem, utcnow)
from .security import hash_password
from .services.pricing import build_quote
from .services.reviews import recompute_listing_rating, tenure_label

SEED_FILE = Path(__file__).parent / "seed_data" / "seed.json"

HOST_LAST = {"kamal": "Singh", "priya": "Sharma", "rohan": "Verma", "anjali": "Mehta", "vikram": "Rao",
             "meera": "Iyer", "arjun": "Nair", "sneha": "Kapoor"}
GUESTS = [("Aarav", "Mehta"), ("Simran", "Kaur"), ("Karthik", "Reddy"), ("Anushka", "Gupta"), ("Chandramani", "Jha"),
          ("Seema", "Joshi"), ("Vishal", "Malhotra"), ("Ayub", "Khan"), ("Neha", "Bansal"), ("Gurpreet", "Sandhu"),
          ("Ishaan", "Arora"), ("Tanvi", "Desai")]
REVIEWER_NAMES = ["Karthik", "Anushka", "Chandramani", "Seema", "Vishal", "Ayub", "Neha", "Gurpreet", "Ishaan", "Simran",
                  "Aarav", "Tanvi", "Rahul", "Pooja", "Aditya", "Meghna", "Rohit", "Kavya", "Siddharth", "Ananya",
                  "Manav", "Ritika", "Harsh", "Divya", "Yash", "Nisha", "Varun", "Isha", "Kabir", "Mehak"]
REVIEW_TEXTS = [
    "It was a great stay with amazing views. A bit offbeat and close to nature.",
    "Lovely place and the hosts were very friendly. Everything was clean and exactly as described.",
    "Awesome experience, hosts were super helpful. Perfect place for a peaceful vacation.",
    "Place was good, value for money. Just a bit of a parking issue.",
    "One of our best stays ever. Would definitely come back.",
    "Great location and a comfortable bed. Check-in was smooth and quick.",
    "The host went out of the way to help us with local tips. Highly recommended.",
    "Very cosy and quiet. Wifi was fast enough to work from here for a few days.",
    "Clean, safe and well maintained. The kitchen had everything we needed.",
    "Amazing hospitality. The photos match the place perfectly.",
    "Spotless rooms and a lovely view from the balcony. We loved the neighbourhood.",
    "Easy to find, close to the market and the host replied within minutes.",
    "Spacious living area, a comfortable bed and plenty of hot water. Great value.",
    "A warm, welcoming home. The host left us fresh fruit and local snacks.",
    "Quiet location and very safe. Parking was easy and the check-in was self-serve.",
]
SINCE = ["2 years on Airbnb", "1 month on Airbnb", "11 months on Airbnb", "3 years on Airbnb", "4 months on Airbnb", "6 years on Airbnb"]


def _years_to_days(label: str) -> int:
    n, unit = label.split()[:2]
    return int(n) * (365 if unit.startswith("year") else 30)


def seed(db: Session, today: date | None = None) -> None:
    today = today or date.today()
    data = json.loads(SEED_FILE.read_text())
    rnd = random.Random(2026)
    pw = hash_password(settings.demo_password)  # same demo password for every seeded account

    for a in data["amenities"]:
        db.add(Amenity(id=a["id"], label=a["label"], icon=a["icon"], group=a["group"], hint=a.get("hint")))
    for i, c in enumerate(c for c in data["categories"] if c["id"] != "all"):
        db.add(Category(id=c["id"], label=c["label"], icon=c["icon"], sort=i))
    db.flush()

    # ── users
    hosts: dict[str, User] = {}
    for h in data["hosts"]:
        u = User(id=f"user_{h['id']}", email=f"{h['id']}@host.demo", password_hash=pw, first_name=h["name"],
                 last_name=HOST_LAST[h["id"]], avatar_url=h.get("avatar"), is_host=True, profile={},
                 created_at=datetime.combine(today - timedelta(days=_years_to_days(h["years"])), datetime.min.time()))
        hosts[h["id"]] = u
        db.add(u)
    guests: list[User] = []
    for i, (f, l) in enumerate(GUESTS):
        u = User(id=f"user_guest{i + 1}", email=f"{f.lower()}.{l.lower()}@guest.demo", password_hash=pw, first_name=f,
                 last_name=l, profile={}, created_at=datetime.combine(today - timedelta(days=rnd.randint(40, 1500)), datetime.min.time()))
        guests.append(u)
        db.add(u)
    demo = User(id="user_demo", email="guest@demo.com", password_hash=pw, first_name="Demo", last_name="Guest", profile={},
                created_at=datetime.combine(today - timedelta(days=200), datetime.min.time()))
    db.add(demo)
    db.flush()

    # ── listings
    listings: dict[str, Listing] = {}
    for d in data["listings"]:
        discounts = [k for k, v in (("weekly", d.get("weeklyDiscount")), ("monthly", d.get("monthlyDiscount"))) if v]
        l = Listing(
            id=d["id"], owner_id=hosts[d["hostId"]].id, title=d["title"], kind=d["kind"], place=d["place"], city=d["city"],
            area=d["area"], state=d["state"], address=f"{d['area']}, {d['city']}, {d['state']}", price=d["price"],
            max_guests=d["maxGuests"], bedrooms=d["bedrooms"], beds=d["beds"], baths=d["baths"], description=d["description"],
            instant_book=d["instantBook"], self_check_in=d["selfCheckIn"], free_cancel=d["freeCancel"],
            guest_favourite=d["guestFavourite"], lat=d["lat"], lng=d["lng"], discounts=discounts, rank=d["rank"],
            weekend_pct=0, rating=d["rating"], review_count=d["reviewCount"],
            created_at=datetime.combine(today - timedelta(days=rnd.randint(30, 400)), datetime.min.time()))
        l.images = [ListingImage(url=u, position=i) for i, u in enumerate(d["images"])]
        db.add(l)
        listings[l.id] = l
    db.flush()
    amen = {a.id: a for a in db.scalars(select(Amenity))}
    cats = {c.id: c for c in db.scalars(select(Category))}
    for d in data["listings"]:
        l = listings[d["id"]]
        l.amenities = [amen[a] for a in dict.fromkeys(d["amenities"]) if a in amen]
        l.categories = [cats[c] for c in dict.fromkeys(d["categories"]) if c in cats]
    db.flush()

    # ── bookings that already exist on listings (these block the dates)
    convs: set[tuple[str, str]] = set()
    for d in data["listings"]:
        l = listings[d["id"]]
        for n, (a, b) in enumerate(sorted(d["bookedOffsets"])):
            ci, co = today + timedelta(days=a), today + timedelta(days=b)
            if co <= ci or ci < today:
                continue
            g = guests[rnd.randrange(len(guests))]
            adults = rnd.randint(1, max(1, l.max_guests))
            q = build_quote(l, ci, co, today, n)
            status = "pending" if (not l.instant_book and n == 1) else "confirmed"
            bk = Booking(code=f"S{rnd.randrange(16**5):05X}", listing_id=l.id, guest_id=g.id, check_in=ci, check_out=co,
                         adults=adults, children=0, infants=0, pets=0, nights=q.nights, nightly=q.nightly_avg,
                         subtotal=q.subtotal, discount_type=q.discount_type, discount_amount=q.discount_amount,
                         cleaning_fee=q.cleaning_fee, service_fee=q.service_fee, total=q.total, status=status,
                         payment_method="card", created_at=utcnow() - timedelta(days=rnd.randint(1, 20)))
            db.add(bk)
            if rnd.random() < 0.35 and (l.id, g.id) not in convs:
                conv = Conversation(listing_id=l.id, host_id=l.owner_id, guest_id=g.id)
                db.add(conv)
                db.flush()
                convs.add((l.id, g.id))
                db.add(Message(conversation_id=conv.id, sender_id=g.id, text=f"Hi! Is early check-in possible at {l.title}?",
                               created_at=utcnow() - timedelta(hours=rnd.randint(1, 72))))
                if rnd.random() < 0.5:
                    db.add(Message(conversation_id=conv.id, sender_id=l.owner_id,
                                   text="Hello! Yes, from 12 noon if the room is ready. See you soon.",
                                   created_at=utcnow() - timedelta(hours=rnd.randint(0, 24))))
    db.flush()

    # ── reviews: mean of stars matches the listing's seeded rating
    avatars = data.get("reviewerAvatars", [])
    all_reviews: list[Review] = []
    for d in data["listings"]:
        n = d["reviewCount"]
        fours = round((5 - d["rating"]) * n)
        stars = [4] * fours + [5] * (n - fours)
        rnd.shuffle(stars)
        names = REVIEWER_NAMES[:]
        rnd.shuffle(names)
        for i in range(n):
            s = stars[i]
            name, text, avatar = names[i % len(names)], REVIEW_TEXTS[rnd.randrange(len(REVIEW_TEXTS))], None
            if d["id"] == "meleto-woods" and i < 5:
                name, text, avatar = ["Karthik", "Anushka", "Chandramani", "Seema", "Vishal"][i], REVIEW_TEXTS[i], (avatars[i] if i < len(avatars) else None)
            sub = lambda: s if rnd.random() > 0.12 else max(1, s - 1)
            age = [5, 8, 15, 22][i] if d["id"] == "meleto-woods" and i < 4 else rnd.randint(30, 700)
            all_reviews.append(Review(
                listing_id=d["id"], author_name=name, author_avatar=avatar, author_since=SINCE[rnd.randrange(len(SINCE))],
                stars=s, cleanliness=sub(), accuracy=sub(), checkin=sub(), communication=sub(), location=sub(), text=text,
                created_at=datetime.combine(today - timedelta(days=age), datetime.min.time())))
    db.add_all(all_reviews)
    db.flush()
    for l in listings.values():
        recompute_listing_rating(db, l)

    # ── activities
    for i, a in enumerate(data["experiences"] + data["services"]):
        db.add(Activity(id=a["id"], kind=a["kind"], title=a["title"], city=a["city"], price=a["price"], unit=a["unit"],
                        rating=a.get("rating", 0), image=a["image"], badge=a.get("badge"), when_label=a.get("when"),
                        section=a["section"], category=a.get("category"), minimum=a.get("minimum"),
                        location=a.get("location"), coming_soon=a.get("comingSoon"), host_name=a["host"],
                        duration=a["duration"], description=a["description"], rank=i))
    db.flush()

    # ── demo guest: two past stays (one already reviewed), one upcoming, a small wishlist
    def stay(listing_id: str, start: int, nights: int, status="confirmed") -> Booking:
        l = listings[listing_id]
        ci, co = today + timedelta(days=start), today + timedelta(days=start + nights)
        q = build_quote(l, ci, co, today, 3)
        b = Booking(code=f"D{rnd.randrange(16**5):05X}", listing_id=l.id, guest_id=demo.id, check_in=ci, check_out=co,
                    adults=2, children=0, infants=0, pets=0, nights=q.nights, nightly=q.nightly_avg, subtotal=q.subtotal,
                    discount_type=q.discount_type, discount_amount=q.discount_amount, cleaning_fee=q.cleaning_fee,
                    service_fee=q.service_fee, total=q.total, status=status, payment_method="card",
                    created_at=utcnow() - timedelta(days=abs(start) + 10))
        db.add(b)
        return b

    past_unreviewed = stay("manali-1", -40, 3)
    past_reviewed = stay("chandigarh-2", -90, 2)
    stay("shimla-3", 60, 4)
    db.flush()
    r = Review(listing_id="chandigarh-2", booking_id=past_reviewed.id, author_id=demo.id, author_name="Demo",
               author_since="6 months on Airbnb", stars=5, cleanliness=5, accuracy=5, checkin=5, communication=5, location=5,
               text="Great central location and a very responsive host. Would stay again.",
               created_at=datetime.combine(today - timedelta(days=85), datetime.min.time()))
    db.add(r)
    db.flush()
    recompute_listing_rating(db, listings["chandigarh-2"])
    for lid in ("manali-3", "shimla-1", "north-goa-2"):
        db.add(WishlistItem(user_id=demo.id, item_type="listing", item_id=lid))
    db.add(WishlistItem(user_id=demo.id, item_type="experience", item_id="exp-1"))
    db.commit()


def seed_if_empty() -> bool:
    with SessionLocal() as db:
        if db.scalar(select(Listing.id).limit(1)):
            return False
    from .database import WriteSession
    from sqlalchemy.exc import IntegrityError
    try:
        with WriteSession() as db:
            seed(db)
    except IntegrityError:   # another cold-started instance seeded first
        return False
    return True


def reset() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed_if_empty()


if __name__ == "__main__":
    Base.metadata.create_all(engine)
    if "--reset" in sys.argv:
        reset()
        print("Database reset and seeded.")
    else:
        print("Seeded." if seed_if_empty() else "Database already has data — use --reset to start over.")
