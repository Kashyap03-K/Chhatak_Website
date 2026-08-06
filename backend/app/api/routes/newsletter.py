from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.newsletter import NewsletterSubscriber
from app.schemas.newsletter import SubscribeBody, SubscriberOut

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


@router.post("/subscribe", status_code=201)
def subscribe(body: SubscribeBody, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == email).first()
    if existing:
        return {"ok": True, "already_subscribed": True}
    sub = NewsletterSubscriber(email=email)
    db.add(sub)
    db.commit()
    return {"ok": True}


@router.get("/admin/list", response_model=list[SubscriberOut])
def list_subscribers(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return (
        db.query(NewsletterSubscriber)
        .order_by(NewsletterSubscriber.created_at.desc())
        .all()
    )


@router.delete("/admin/{sub_id}", status_code=204)
def delete_subscriber(sub_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    sub = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.id == sub_id).first()
    if sub:
        db.delete(sub)
        db.commit()
