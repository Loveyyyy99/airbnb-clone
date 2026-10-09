from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db, get_write_db
from ..models import Activity, Listing, User, WishlistItem
from ..schemas import WishlistIn, WishlistOut
from ..security import current_user
from ..services.serializers import activity_out, listing_out

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def _payload(db: Session, user_id: str) -> WishlistOut:
    items = db.scalars(select(WishlistItem).where(WishlistItem.user_id == user_id).order_by(WishlistItem.id.desc())).all()
    lids = [i.item_id for i in items if i.item_type == "listing"]
    aids = [i.item_id for i in items if i.item_type != "listing"]
    listings = {l.id: l for l in db.scalars(select(Listing).where(Listing.id.in_(lids), Listing.status == "published").options(
        selectinload(Listing.images), selectinload(Listing.amenities), selectinload(Listing.categories)))} if lids else {}
    acts = {a.id: a for a in db.scalars(select(Activity).where(Activity.id.in_(aids)))} if aids else {}
    return WishlistOut(ids=[i.item_id for i in items],
                       listings=[listing_out(listings[i]) for i in lids if i in listings],
                       activities=[activity_out(acts[i]) for i in aids if i in acts])


@router.get("", response_model=WishlistOut)
def get_wishlist(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _payload(db, user.id)


@router.put("", response_model=WishlistOut)
def add(body: WishlistIn, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    model = Listing if body.item_type == "listing" else Activity
    if not db.get(model, body.item_id):
        raise HTTPException(404, "Item not found")
    exists = db.scalar(select(WishlistItem).where(WishlistItem.user_id == user.id, WishlistItem.item_type == body.item_type,
                                                  WishlistItem.item_id == body.item_id))
    if not exists:
        db.add(WishlistItem(user_id=user.id, item_type=body.item_type, item_id=body.item_id))
        db.commit()
    return _payload(db, user.id)


@router.delete("/{item_type}/{item_id}", response_model=WishlistOut)
def remove(item_type: str, item_id: str, user: User = Depends(current_user), db: Session = Depends(get_write_db)):
    db.query(WishlistItem).filter(WishlistItem.user_id == user.id, WishlistItem.item_type == item_type,
                                  WishlistItem.item_id == item_id).delete()
    db.commit()
    return _payload(db, user.id)
