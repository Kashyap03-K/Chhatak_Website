import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.email import send_verification_email

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def _new_verification_token() -> str:
    return secrets.token_urlsafe(32)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if body.phone and db.query(User).filter(User.phone == body.phone).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    token = _new_verification_token()
    user = User(
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        email_verified=False,
        verification_token=token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    try:
        send_verification_email(user, token)
    except Exception as e:  # never fail registration because email failed
        logger.error("Verification email failed for %s: %s", user.email, e)

    access = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, user_id=user.id, name=user.name, is_admin=user.is_admin)


@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        logger.warning("Failed login attempt for %s from %s", body.email, request.client.host)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    logger.info("User %s logged in from %s", user.id, request.client.host)
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, is_admin=user.is_admin)


class VerifyResponse(BaseModel):
    verified: bool
    email: str | None = None


@router.get("/verify-email", response_model=VerifyResponse)
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")
    user.email_verified = True
    user.verification_token = None
    db.commit()
    logger.info("Email verified for %s", user.email)
    return VerifyResponse(verified=True, email=user.email)


class ResendRequest(BaseModel):
    email: EmailStr


@router.post("/resend-verification")
def resend_verification(body: ResendRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    # Do not reveal whether the account exists
    if user and not user.email_verified:
        token = _new_verification_token()
        user.verification_token = token
        db.commit()
        send_verification_email(user, token)
    return {"ok": True}
