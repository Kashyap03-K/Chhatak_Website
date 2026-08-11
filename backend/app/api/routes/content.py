from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.content import Review
from app.schemas.content import ReviewOut, ReviewCreate, ReviewUpdate

reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


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
