from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressOut

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("/", response_model=list[AddressOut])
def list_addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Address).filter(Address.user_id == user.id).all()


def _normalize(v: str | None) -> str:
    return (v or "").strip().casefold()


@router.post("/", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(body: AddressCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Dedupe: if the user already has a functionally identical address
    # (same phone + line1 + city + state + pincode, case/space-insensitive),
    # return the existing row instead of inserting a duplicate.
    existing = db.query(Address).filter(Address.user_id == user.id).all()
    for a in existing:
        if (
            _normalize(a.phone) == _normalize(body.phone)
            and _normalize(a.address_line1) == _normalize(body.address_line1)
            and _normalize(a.address_line2) == _normalize(body.address_line2)
            and _normalize(a.city) == _normalize(body.city)
            and _normalize(a.state) == _normalize(body.state)
            and _normalize(a.pincode) == _normalize(body.pincode)
        ):
            if body.is_default and not a.is_default:
                db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})
                a.is_default = True
                db.commit()
                db.refresh(a)
            return a

    if body.is_default:
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})

    address = Address(user_id=user.id, **body.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/{address_id}", response_model=AddressOut)
def update_address(address_id: int, body: AddressUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    updates = body.model_dump(exclude_unset=True)
    if updates.get("is_default"):
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})

    for key, value in updates.items():
        setattr(address, key, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    db.delete(address)
    db.commit()
