from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.content import Reel, Review
from app.schemas.content import (
    ReelOut, ReelCreate, ReelUpdate,
    ReviewOut, ReviewCreate, ReviewUpdate,
)

reels_router = APIRouter(prefix="/reels", tags=["reels"])
reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


# ----- Reels -----

@reels_router.get("/", response_model=list[ReelOut])
def list_reels(db: Session = Depends(get_db)):
    return (
        db.query(Reel)
        .filter(Reel.is_active == True)
        .order_by(Reel.sort_order.asc(), Reel.id.asc())
        .all()
    )


@reels_router.get("/admin/all", response_model=list[ReelOut])
def list_reels_admin(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Reel).order_by(Reel.sort_order.asc(), Reel.id.asc()).all()


@reels_router.post("/", response_model=ReelOut, status_code=status.HTTP_201_CREATED)
def create_reel(body: ReelCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    reel = Reel(**body.model_dump())
    db.add(reel)
    db.commit()
    db.refresh(reel)
    return reel


@reels_router.put("/{reel_id}", response_model=ReelOut)
def update_reel(reel_id: int, body: ReelUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(reel, key, value)
    db.commit()
    db.refresh(reel)
    return reel


@reels_router.delete("/{reel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reel(reel_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    reel = db.query(Reel).filter(Reel.id == reel_id).first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    db.delete(reel)
    db.commit()


# ----- Reviews -----

@reviews_router.get("/", response_model=list[ReviewOut])
def list_reviews(db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.is_active == True)
        .order_by(Review.sort_order.asc(), Review.id.asc())
        .all()
    )


@reviews_router.get("/admin/all", response_model=list[ReviewOut])
def list_reviews_admin(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return db.query(Review).order_by(Review.sort_order.asc(), Review.id.asc()).all()


@reviews_router.post("/", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(body: ReviewCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    review = Review(**body.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@reviews_router.put("/{review_id}", response_model=ReviewOut)
def update_review(review_id: int, body: ReviewUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(review, key, value)
    db.commit()
    db.refresh(review)
    return review


@reviews_router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
