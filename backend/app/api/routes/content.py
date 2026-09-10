from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.content import Review
from app.schemas.content import ReviewOut, ReviewCreate, ReviewUpdate
from pydantic import BaseModel, Field

reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])


class ReviewSubmission(BaseModel):
    author: str = Field(..., min_length=1, max_length=120)
    location: str | None = Field(None, max_length=120)
    rating: int = Field(5, ge=1, le=5)
    quote: str = Field(..., min_length=4, max_length=1000)


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
    # Newest first so freshly submitted reviews are easy to spot for approval.
    return (
        db.query(Review)
        .order_by(Review.created_at.desc(), Review.id.desc())
        .all()
    )


@reviews_router.post("/submit", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def submit_review(body: ReviewSubmission, db: Session = Depends(get_db)):
    """Public: customer-submitted review. Stored inactive so an admin has to approve it before it goes live."""
    review = Review(
        author=body.author.strip(),
        location=(body.location or "").strip() or None,
        rating=body.rating,
        quote=body.quote.strip(),
        is_active=False,   # requires admin approval before it shows on the storefront
        sort_order=0,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


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
