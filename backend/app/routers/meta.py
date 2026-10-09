from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Amenity, Category, Listing
from ..schemas import AmenityOut, Camel, CategoryOut

router = APIRouter(prefix="/meta", tags=["meta"])


class PlaceOut(Camel):
    city: str
    state: str
    listings: int


@router.get("/amenities", response_model=list[AmenityOut])
def amenities(db: Session = Depends(get_db)):
    return [AmenityOut(id=a.id, label=a.label, icon=a.icon, group=a.group, hint=a.hint) for a in db.scalars(select(Amenity))]


@router.get("/categories", response_model=list[CategoryOut])
def categories(db: Session = Depends(get_db)):
    return [CategoryOut(id=c.id, label=c.label, icon=c.icon) for c in db.scalars(select(Category).order_by(Category.sort))]


@router.get("/places", response_model=list[PlaceOut])
def places(q: str = "", db: Session = Depends(get_db)):
    """Destinations that actually have listings (for search suggestions)."""
    stmt = select(Listing.city, Listing.state, func.count()).where(Listing.status == "published").group_by(Listing.city, Listing.state)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        stmt = stmt.where(func.lower(Listing.city).like(like) | func.lower(Listing.state).like(like))
    return [PlaceOut(city=c, state=s, listings=n) for c, s, n in db.execute(stmt.order_by(func.count().desc()).limit(20))]
