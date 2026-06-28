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


@router.post("/", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(body: AddressCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
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
