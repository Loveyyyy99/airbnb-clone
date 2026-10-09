"""Database schema.

Entity overview
---------------
users 1─* listings 1─* listing_images
listings *─* amenities            (listing_amenities)
listings *─* categories           (listing_categories)
listings 1─* bookings *─1 users   (guest)
listings 1─* blocked_dates        (host-blocked nights)
listings 1─* reviews              (one review per completed booking)
users 1─* wishlist_items          (listing / experience / service ids)
activities 1─* activity_bookings *─1 users
conversations 1─* messages        (guest ↔ host, per listing)
users 1─1 host_drafts             (unfinished listing from the host wizard)
"""
from __future__ import annotations

import secrets
from datetime import date, datetime, timezone

from sqlalchemy import (JSON, LargeBinary, Boolean, CheckConstraint, Column, Date, DateTime, Float, ForeignKey, Index, Integer,
                        String, Table, Text, UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}_{secrets.token_hex(5)}"


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


listing_amenities = Table(
    "listing_amenities", Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)
listing_categories = Table(
    "listing_categories", Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("user"))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80), default="")
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)  # guest vs host role
    profile: Mapped[dict] = mapped_column(JSON, default=dict)      # "About me" answers, interests, stamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    listings: Mapped[list["Listing"]] = relationship(back_populates="owner")


class Amenity(Base):
    __tablename__ = "amenities"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    label: Mapped[str] = mapped_column(String(80))
    icon: Mapped[str] = mapped_column(String(16))
    group: Mapped[str] = mapped_column(String(16))  # basics | standout | safety
    hint: Mapped[str | None] = mapped_column(String(200), nullable=True)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    label: Mapped[str] = mapped_column(String(60))
    icon: Mapped[str] = mapped_column(String(16))
    sort: Mapped[int] = mapped_column(Integer, default=0)


class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_listing_price"),
        CheckConstraint("max_guests >= 1", name="ck_listing_guests"),
        Index("ix_listings_city_status", "city", "status"),
        Index("ix_listings_price", "price"),
    )
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120))
    kind: Mapped[str] = mapped_column(String(40))            # Home, Flat, Villa, Cabin ...
    place: Mapped[str] = mapped_column(String(10))           # entire | room | shared
    city: Mapped[str] = mapped_column(String(80), index=True)
    area: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(80))
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)   # private (host only)
    pin: Mapped[str | None] = mapped_column(String(12), nullable=True)
    precise_location: Mapped[bool] = mapped_column(Boolean, default=False)
    lat: Mapped[float] = mapped_column(Float, default=0.0)
    lng: Mapped[float] = mapped_column(Float, default=0.0)
    price: Mapped[int] = mapped_column(Integer)              # INR per night
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    baths: Mapped[int] = mapped_column(Integer, default=1)
    description: Mapped[str] = mapped_column(Text, default="")
    instant_book: Mapped[bool] = mapped_column(Boolean, default=False)
    self_check_in: Mapped[bool] = mapped_column(Boolean, default=False)
    free_cancel: Mapped[bool] = mapped_column(Boolean, default=True)
    guest_favourite: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(12), default="published")     # published | unlisted
    weekend_pct: Mapped[int] = mapped_column(Integer, default=0)
    discounts: Mapped[list] = mapped_column(JSON, default=list)              # new | last | weekly | monthly
    safety: Mapped[list] = mapped_column(JSON, default=list)                 # camera | noise | weapon
    camera_note: Mapped[str | None] = mapped_column(String(300), nullable=True)
    business_host: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)                # denormalised from reviews
    review_count: Mapped[int] = mapped_column(Integer, default=0)            # denormalised from reviews
    rank: Mapped[int] = mapped_column(Integer, default=0, index=True)        # "recommended" ordering
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship(back_populates="listings")
    images: Mapped[list["ListingImage"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", order_by="ListingImage.position")
    amenities: Mapped[list[Amenity]] = relationship(secondary=listing_amenities)
    categories: Mapped[list[Category]] = relationship(secondary=listing_categories)
    bookings: Mapped[list["Booking"]] = relationship(back_populates="listing", cascade="all, delete-orphan")
    blocked_dates: Mapped[list["BlockedDate"]] = relationship(cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="listing", cascade="all, delete-orphan")


class ListingImage(Base):
    __tablename__ = "listing_images"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[str] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(600))
    position: Mapped[int] = mapped_column(Integer, default=0)
    listing: Mapped[Listing] = relationship(back_populates="images")


class BlockedDate(Base):
    """A single night the host has blocked on the calendar."""
    __tablename__ = "blocked_dates"
    __table_args__ = (UniqueConstraint("listing_id", "day", name="uq_blocked_listing_day"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[str] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date)


class Booking(Base):
    """A stay. Nights are the half-open range [check_in, check_out)."""
    __tablename__ = "bookings"
    __table_args__ = (
        CheckConstraint("check_out > check_in", name="ck_booking_dates"),
        CheckConstraint("nights >= 1", name="ck_booking_nights"),
        Index("ix_bookings_listing_dates", "listing_id", "check_in", "check_out"),
    )
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("bk"))
    code: Mapped[str] = mapped_column(String(10), unique=True)               # confirmation code
    listing_id: Mapped[str] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)
    adults: Mapped[int] = mapped_column(Integer, default=1)
    children: Mapped[int] = mapped_column(Integer, default=0)
    infants: Mapped[int] = mapped_column(Integer, default=0)
    pets: Mapped[int] = mapped_column(Integer, default=0)
    nights: Mapped[int] = mapped_column(Integer)
    nightly: Mapped[int] = mapped_column(Integer)          # average nightly rate at booking time
    subtotal: Mapped[int] = mapped_column(Integer)
    discount_type: Mapped[str | None] = mapped_column(String(12), nullable=True)
    discount_amount: Mapped[int] = mapped_column(Integer, default=0)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    service_fee: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="confirmed", index=True)  # pending|confirmed|cancelled|declined
    payment_method: Mapped[str] = mapped_column(String(10), default="card")           # mocked – nothing is stored
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    listing: Mapped[Listing] = relationship(back_populates="bookings")
    guest: Mapped[User] = relationship()
    review: Mapped["Review | None"] = relationship(back_populates="booking", uselist=False)


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("stars BETWEEN 1 AND 5", name="ck_review_stars"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    listing_id: Mapped[str] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id", ondelete="SET NULL"), unique=True, nullable=True)
    author_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(80))
    author_avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    author_since: Mapped[str] = mapped_column(String(40), default="")
    stars: Mapped[int] = mapped_column(Integer)
    cleanliness: Mapped[int] = mapped_column(Integer)
    accuracy: Mapped[int] = mapped_column(Integer)
    checkin: Mapped[int] = mapped_column(Integer)
    communication: Mapped[int] = mapped_column(Integer)
    location: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    listing: Mapped[Listing] = relationship(back_populates="reviews")
    booking: Mapped[Booking | None] = relationship(back_populates="review")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"
    __table_args__ = (UniqueConstraint("user_id", "item_type", "item_id", name="uq_wishlist_item"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    item_type: Mapped[str] = mapped_column(String(12))   # listing | experience | service
    item_id: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Activity(Base):
    """Experiences and services share one table, split by `kind`."""
    __tablename__ = "activities"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    kind: Mapped[str] = mapped_column(String(12), index=True)   # experience | service
    title: Mapped[str] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(80))
    price: Mapped[int] = mapped_column(Integer)
    unit: Mapped[str] = mapped_column(String(8), default="guest")  # guest | group
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    image: Mapped[str] = mapped_column(String(600))
    badge: Mapped[str | None] = mapped_column(String(30), nullable=True)
    when_label: Mapped[str | None] = mapped_column(String(40), nullable=True)
    section: Mapped[str] = mapped_column(String(60))
    category: Mapped[str | None] = mapped_column(String(40), nullable=True)   # service type
    minimum: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String(120), nullable=True)
    coming_soon: Mapped[str | None] = mapped_column(String(60), nullable=True)
    host_name: Mapped[str] = mapped_column(String(60))
    duration: Mapped[str] = mapped_column(String(30), default="2 hours")
    description: Mapped[str] = mapped_column(Text, default="")
    rank: Mapped[int] = mapped_column(Integer, default=0)


class ActivityBooking(Base):
    __tablename__ = "activity_bookings"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("ab"))
    code: Mapped[str] = mapped_column(String(10), unique=True)
    activity_id: Mapped[str] = mapped_column(ForeignKey("activities.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    day: Mapped[date] = mapped_column(Date)
    guests: Mapped[int] = mapped_column(Integer, default=1)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="confirmed")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    activity: Mapped[Activity] = relationship()


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("listing_id", "guest_id", name="uq_conversation"),)
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("cv"))
    listing_id: Mapped[str] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    host_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    guest_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    listing: Mapped[Listing] = relationship()
    guest: Mapped[User] = relationship(foreign_keys=[guest_id])
    messages: Mapped[list["Message"]] = relationship(cascade="all, delete-orphan", order_by="Message.id")


class Message(Base):
    __tablename__ = "messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class HostDraft(Base):
    """The in-progress listing from the 19-step host wizard (one per host)."""
    __tablename__ = "host_drafts"
    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: new_id("draft"))
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    listing_id: Mapped[str | None] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), nullable=True)  # set when editing
    step: Mapped[int] = mapped_column(Integer, default=1)
    data: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)


class UploadedFile(Base):
    """Uploaded images live in the database so they persist on hosts with an ephemeral filesystem (e.g. Vercel)."""
    __tablename__ = "uploaded_files"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    content_type: Mapped[str] = mapped_column(String(40))
    data: Mapped[bytes] = mapped_column(LargeBinary)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
