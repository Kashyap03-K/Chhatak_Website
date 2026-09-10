from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.database import get_db
from app.models.shipping import ShippingConfig

router = APIRouter(prefix="/shipping", tags=["shipping"])

VALID_METHODS = {"cod", "online"}
DEFAULTS = {"cod": (49.0, 499.0), "online": (0.0, 0.0)}


class ShippingRow(BaseModel):
    payment_method: str
    amount: float = Field(ge=0)
    free_above: float = Field(ge=0)


def _ensure_seeded(db: Session) -> None:
    """Insert default rows for any missing payment method."""
    existing = {r.payment_method for r in db.query(ShippingConfig).all()}
    for method, (amount, free_above) in DEFAULTS.items():
        if method not in existing:
            db.add(ShippingConfig(payment_method=method, amount=amount, free_above=free_above))
    db.commit()


@router.get("/config", response_model=list[ShippingRow])
def get_shipping_config(db: Session = Depends(get_db)):
    """Public: current shipping rules for both payment methods."""
    _ensure_seeded(db)
    rows = db.query(ShippingConfig).all()
    return [ShippingRow(payment_method=r.payment_method, amount=r.amount, free_above=r.free_above) for r in rows]


@router.put("/admin/config/{payment_method}", response_model=ShippingRow)
def update_shipping_config(
    payment_method: str,
    body: ShippingRow,
    db: Session = Depends(get_db),
    _=Depends(get_current_admin),
):
    if payment_method not in VALID_METHODS:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    _ensure_seeded(db)
    row = db.query(ShippingConfig).filter(ShippingConfig.payment_method == payment_method).first()
    if not row:
        row = ShippingConfig(payment_method=payment_method)
        db.add(row)
    row.amount = body.amount
    row.free_above = body.free_above
    db.commit()
    db.refresh(row)
    return ShippingRow(payment_method=row.payment_method, amount=row.amount, free_above=row.free_above)


def compute_shipping(db: Session, payment_method: str, subtotal: float) -> float:
    """Server-authoritative shipping for a given payment method + subtotal."""
    method = "cod" if payment_method == "cod" else "online"
    row = db.query(ShippingConfig).filter(ShippingConfig.payment_method == method).first()
    if not row:
        _ensure_seeded(db)
        row = db.query(ShippingConfig).filter(ShippingConfig.payment_method == method).first()
    if not row:
        return 0.0
    if row.free_above > 0 and subtotal >= row.free_above:
        return 0.0
    return float(row.amount)
