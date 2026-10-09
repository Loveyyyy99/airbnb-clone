"""Pydantic request/response models. JSON uses camelCase (what the Next.js frontend consumes)."""
from datetime import date

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from pydantic.alias_generators import to_camel


class Camel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


# ───────── auth / users
class SignupIn(Camel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    dob: date | None = None

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@")[-1] or " " in v:
            raise ValueError("Enter a valid email")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def _name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name is required")
        return v

    @field_validator("dob")
    @classmethod
    def _adult(cls, v: date | None) -> date | None:
        if v is not None:
            today = date.today()
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 18:
                raise ValueError("You must be at least 18 to sign up")
        return v


class LoginIn(Camel):
    email: str
    password: str


class CheckEmailIn(Camel):
    email: str


class DemoLoginIn(Camel):
    provider: str = "google"


class ProfileData(Camel):
    school: str = ""
    work: str = ""
    dream: str = ""
    pets: str = ""
    decade: str = ""
    fun: str = ""
    song: str = ""
    skill: str = ""
    time: str = ""
    languages: str = ""
    intro: str = Field(default="", max_length=450)
    interests: list[str] = []
    stamps: bool = True


class UserUpdate(Camel):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=500)
    profile: ProfileData | None = None


class UserOut(Camel):
    id: str
    first_name: str
    last_name: str
    email: str
    dob: date | None = None
    avatar_url: str | None = None
    is_host: bool
    profile: ProfileData
    created_at: str


class AuthOut(Camel):
    token: str
    user: UserOut


# ───────── listings
class HostOut(Camel):
    id: str
    name: str
    superhost: bool
    years: str
    avatar: str | None = None
    reviews: int
    rating: float
    about: str


class ListingOut(Camel):
    id: str
    title: str
    kind: str
    place: str
    city: str
    area: str
    state: str
    price: int
    rating: float
    review_count: int
    guest_favourite: bool
    images: list[str]
    max_guests: int
    bedrooms: int
    beds: int
    baths: int
    amenities: list[str]
    categories: list[str]
    host_id: str
    owner_id: str
    description: str
    instant_book: bool
    self_check_in: bool
    free_cancel: bool
    lat: float
    lng: float
    status: str
    weekend: int
    weekly_discount: int
    monthly_discount: int


class RatingRow(Camel):
    label: str
    value: str
    icon: str


class ListingDetailOut(ListingOut):
    host: HostOut
    unavailable: list[list[str]]
    rating_breakdown: list[RatingRow]
    rating_histogram: list[int]          # counts for 5,4,3,2,1 stars


class ListingHostOut(ListingOut):
    """Owner view: includes private address fields and host-blocked nights."""
    address: str | None = None
    pin: str | None = None
    precise_location: bool = False
    discounts: list[str] = []
    safety: list[str] = []
    camera_note: str | None = None
    business_host: bool | None = None
    host_blocked: list[str] = []
    booking_count: int = 0


class ListingPage(Camel):
    items: list[ListingOut]
    total: int
    page: int
    page_size: int
    has_more: bool


class MapPoint(Camel):
    id: str
    lat: float
    lng: float
    price: int


class CountOut(Camel):
    total: int


class DiscountOut(Camel):
    type: str
    label: str
    pct: int
    amount: int


class QuoteOut(Camel):
    available: bool
    reason: str | None = None
    nights: int = 0
    nightly_avg: int = 0
    subtotal: int = 0
    discount: DiscountOut | None = None
    cleaning_fee: int = 0
    service_fee: int = 0
    total: int = 0


class ListingWrite(Camel):
    """Payload from the host wizard (create) and the listing editor (update)."""
    title: str = Field(min_length=1, max_length=50)
    kind: str = Field(min_length=1, max_length=40)
    place: str = Field(default="entire", pattern="^(entire|room|shared)$")
    description: str = Field(default="", max_length=500)
    address: str | None = Field(default=None, max_length=300)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(default="", max_length=80)
    area: str = Field(default="", max_length=120)
    pin: str | None = Field(default=None, max_length=12)
    precise_location: bool = False
    lat: float | None = None
    lng: float | None = None
    price: int = Field(ge=300, le=1_000_000)
    weekend: int = Field(default=0, ge=0, le=99)
    max_guests: int = Field(default=2, ge=1, le=16)
    bedrooms: int = Field(default=1, ge=0, le=20)
    beds: int = Field(default=1, ge=1, le=30)
    baths: int = Field(default=1, ge=1, le=20)
    amenities: list[str] = []
    photos: list[str] = Field(min_length=1, max_length=40)
    instant_book: bool = False
    discounts: list[str] = []
    safety: list[str] = []
    camera_note: str | None = Field(default=None, max_length=300)
    business_host: bool | None = None
    free_cancel: bool = True
    self_check_in: bool = False

    @field_validator("discounts")
    @classmethod
    def _disc(cls, v: list[str]) -> list[str]:
        bad = [d for d in v if d not in {"new", "last", "weekly", "monthly"}]
        if bad:
            raise ValueError(f"Unknown discount: {bad[0]}")
        return v

    @field_validator("photos")
    @classmethod
    def _photos(cls, v: list[str]) -> list[str]:
        for u in v:
            if not (u.startswith("http://") or u.startswith("https://") or u.startswith("/uploads/")):
                raise ValueError("Photos must be http(s) URLs or uploaded files")
        return v


class ListingPatch(Camel):
    """Partial update used by the host calendar (price, cancellation, status)."""
    price: int | None = Field(default=None, ge=300, le=1_000_000)
    free_cancel: bool | None = None
    instant_book: bool | None = None
    weekend: int | None = Field(default=None, ge=0, le=99)
    status: str | None = Field(default=None, pattern="^(published|unlisted)$")
    discounts: list[str] | None = None


class BlockDateIn(Camel):
    day: date
    blocked: bool = True


# ───────── bookings
class ListingBrief(Camel):
    id: str
    title: str
    kind: str
    area: str
    city: str
    image: str
    instant_book: bool
    free_cancel: bool


class BookingCreate(Camel):
    listing_id: str
    check_in: date
    check_out: date
    adults: int = Field(default=1, ge=0, le=16)
    children: int = Field(default=0, ge=0, le=15)
    infants: int = Field(default=0, ge=0, le=5)
    pets: int = Field(default=0, ge=0, le=5)
    message: str | None = Field(default=None, max_length=1000)
    payment_method: str = Field(default="card", pattern="^(card|upi)$")


class BookingOut(Camel):
    id: str
    code: str
    listing_id: str
    user_id: str
    guest_name: str
    check_in: date
    check_out: date
    adults: int
    children: int
    infants: int
    pets: int
    nights: int
    nightly: int
    subtotal: int
    discount_amount: int
    discount_type: str | None = None
    cleaning: int
    service: int
    total: int
    status: str
    created_at: str
    listing: ListingBrief
    can_review: bool = False
    reviewed: bool = False


class HostBookingAction(Camel):
    status: str = Field(pattern="^(confirmed|declined)$")


# ───────── reviews
class ReviewOut(Camel):
    id: int
    name: str
    avatar: str | None = None
    since: str
    when: str
    stars: int
    text: str


class ReviewPage(Camel):
    items: list[ReviewOut]
    total: int
    page: int
    page_size: int
    has_more: bool


class ReviewCreate(Camel):
    stars: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=1500)


# ───────── wishlist
class WishlistIn(Camel):
    item_type: str = Field(pattern="^(listing|experience|service)$")
    item_id: str


class ActivityOut(Camel):
    id: str
    kind: str
    title: str
    city: str
    price: int
    unit: str
    rating: float
    image: str
    badge: str | None = None
    when: str | None = None
    section: str
    category: str | None = None
    minimum: int | None = None
    location: str | None = None
    coming_soon: str | None = None
    host: str
    duration: str
    description: str


class WishlistOut(Camel):
    ids: list[str]
    listings: list[ListingOut]
    activities: list[ActivityOut]


class ActivityPage(Camel):
    items: list[ActivityOut]
    total: int


class ActivityBookingCreate(Camel):
    activity_id: str
    day: date
    guests: int = Field(default=1, ge=1, le=10)


class ActivityBookingOut(Camel):
    id: str
    code: str
    day: date
    guests: int
    total: int
    status: str
    created_at: str
    activity: ActivityOut


# ───────── messaging
class MessageOut(Camel):
    id: str
    sender_id: str
    from_: str = Field(alias="from")
    name: str
    text: str
    at: str


class ConversationOut(Camel):
    id: str
    guest: str
    guest_id: str
    listing_id: str
    listing_title: str
    messages: list[MessageOut]


class MessageIn(Camel):
    text: str = Field(min_length=1, max_length=2000)


# ───────── drafts / meta
class DraftIn(Camel):
    step: int = Field(default=1, ge=1, le=19)
    listing_id: str | None = None
    data: dict = {}


class DraftOut(Camel):
    id: str
    step: int
    listing_id: str | None = None
    data: dict
    updated_at: str


class AmenityOut(Camel):
    id: str
    label: str
    icon: str
    group: str
    hint: str | None = None


class CategoryOut(Camel):
    id: str
    label: str
    icon: str


class UploadOut(Camel):
    url: str
