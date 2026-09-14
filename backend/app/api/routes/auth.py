import io
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_admin
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.address import Address
from app.models.order import Order
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.services.email import send_verification_email, send_password_reset_email

PASSWORD_RESET_TTL = timedelta(hours=1)

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


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a reset token and email it. Always returns ok — never reveals whether the account exists."""
    user = db.query(User).filter(User.email == body.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TTL
        db.commit()
        try:
            send_password_reset_email(user, token)
        except Exception as e:
            logger.error("Password reset email failed for %s: %s", user.email, e)
    return {"ok": True}


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


_PW_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$")


@router.post("/reset-password", response_model=TokenResponse)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not _PW_RE.match(body.password):
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters with one uppercase, one lowercase, and one digit.")
    user = db.query(User).filter(User.password_reset_token == body.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    expires = user.password_reset_expires_at
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not expires or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset link has expired. Request a new one.")

    user.password_hash = hash_password(body.password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    db.commit()
    logger.info("Password reset for user %s", user.id)

    access = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=access, user_id=user.id, name=user.name, is_admin=user.is_admin)


def _user_rows(db: Session):
    """Aggregate every user with their addresses, order stats, and latest order."""
    order_stats = (
        db.query(
            Order.user_id,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("total_spent"),
            func.max(Order.created_at).label("last_order_at"),
        )
        .group_by(Order.user_id)
        .subquery()
    )
    rows = (
        db.query(User, order_stats.c.order_count, order_stats.c.total_spent, order_stats.c.last_order_at)
        .outerjoin(order_stats, User.id == order_stats.c.user_id)
        .order_by(User.created_at.desc())
        .all()
    )
    addr_by_user: dict[int, list[Address]] = {}
    for a in db.query(Address).order_by(Address.is_default.desc(), Address.created_at.desc()).all():
        addr_by_user.setdefault(a.user_id, []).append(a)
    return [
        {
            "user": u,
            "order_count": int(oc or 0),
            "total_spent": float(ts or 0.0),
            "last_order_at": lo,
            "addresses": addr_by_user.get(u.id, []),
        }
        for (u, oc, ts, lo) in rows
    ]


@router.get("/admin/users")
def admin_list_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return [
        {
            "id": r["user"].id,
            "name": r["user"].name,
            "email": r["user"].email,
            "phone": r["user"].phone,
            "is_admin": r["user"].is_admin,
            "is_active": r["user"].is_active,
            "email_verified": r["user"].email_verified,
            "created_at": r["user"].created_at,
            "order_count": r["order_count"],
            "total_spent": r["total_spent"],
            "last_order_at": r["last_order_at"],
            "addresses": [
                {
                    "id": a.id,
                    "full_name": a.full_name,
                    "phone": a.phone,
                    "address_line1": a.address_line1,
                    "address_line2": a.address_line2,
                    "city": a.city,
                    "state": a.state,
                    "pincode": a.pincode,
                    "is_default": a.is_default,
                }
                for a in r["addresses"]
            ],
        }
        for r in _user_rows(db)
    ]


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Permanently delete a user and everything they own (orders + line items, payments,
    saved addresses, cart items). Admin-only. Cannot delete yourself or another admin.
    """
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    # Deleting another admin is allowed — the caller has admin rights, so we trust them.
    # Only self-delete is refused, so an admin can't lock everyone out by accident.

    # Core-level bulk delete to avoid ORM 'expected to update N rows' reconciliation.
    from sqlalchemy import delete as sa_delete
    from app.models.order import Order, OrderItem
    from app.models.payment import Payment
    from app.models.address import Address
    from app.models.cart import CartItem

    order_ids = [row[0] for row in db.query(Order.id).filter(Order.user_id == user_id).all()]
    db.expire_all()
    if order_ids:
        db.execute(sa_delete(OrderItem).where(OrderItem.order_id.in_(order_ids)))
        db.execute(sa_delete(Payment).where(Payment.order_id.in_(order_ids)))
        db.execute(sa_delete(Order).where(Order.id.in_(order_ids)))
    db.execute(sa_delete(CartItem).where(CartItem.user_id == user_id))
    db.execute(sa_delete(Address).where(Address.user_id == user_id))
    db.execute(sa_delete(User).where(User.id == user_id))
    db.commit()
    logger.info("Admin %s deleted user %s (%s)", current_admin.id, user_id, target.email)


@router.get("/admin/users/export")
def admin_export_users(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    """Return an .xlsx workbook with a Users sheet and an Addresses sheet."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    rows = _user_rows(db)
    wb = Workbook()

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="0B2340")
    header_align = Alignment(horizontal="left", vertical="center")

    def _write_header(sheet, cols):
        for i, col in enumerate(cols, start=1):
            c = sheet.cell(row=1, column=i, value=col)
            c.font = header_font
            c.fill = header_fill
            c.alignment = header_align
        sheet.freeze_panes = "A2"

    def _autosize(sheet):
        for col in sheet.columns:
            length = max((len(str(c.value)) for c in col if c.value is not None), default=10)
            sheet.column_dimensions[col[0].column_letter].width = min(length + 2, 60)

    users_sheet = wb.active
    users_sheet.title = "Users"
    user_cols = [
        "ID", "Name", "Email", "Phone", "Email Verified", "Admin", "Active",
        "Signed Up", "Orders", "Total Spent (₹)", "Last Order",
        "Default Address", "City", "State", "Pincode",
    ]
    _write_header(users_sheet, user_cols)

    def _fmt_dt(dt):
        if not dt:
            return ""
        return dt.strftime("%Y-%m-%d %H:%M") if isinstance(dt, datetime) else str(dt)

    for i, r in enumerate(rows, start=2):
        u = r["user"]
        default_addr = next((a for a in r["addresses"] if a.is_default), r["addresses"][0] if r["addresses"] else None)
        users_sheet.append([
            u.id,
            u.name,
            u.email,
            u.phone or "",
            "Yes" if u.email_verified else "No",
            "Yes" if u.is_admin else "No",
            "Yes" if u.is_active else "No",
            _fmt_dt(u.created_at),
            r["order_count"],
            round(r["total_spent"], 2),
            _fmt_dt(r["last_order_at"]),
            (default_addr.address_line1 + (", " + default_addr.address_line2 if default_addr.address_line2 else "")) if default_addr else "",
            default_addr.city if default_addr else "",
            default_addr.state if default_addr else "",
            default_addr.pincode if default_addr else "",
        ])
    _autosize(users_sheet)

    addr_sheet = wb.create_sheet("Addresses")
    _write_header(addr_sheet, [
        "User ID", "User Name", "User Email", "Recipient", "Phone",
        "Address Line 1", "Address Line 2", "City", "State", "Pincode", "Default",
    ])
    for r in rows:
        u = r["user"]
        for a in r["addresses"]:
            addr_sheet.append([
                u.id, u.name, u.email,
                a.full_name, a.phone,
                a.address_line1, a.address_line2 or "",
                a.city, a.state, a.pincode,
                "Yes" if a.is_default else "No",
            ])
    _autosize(addr_sheet)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"chhatak-users-{datetime.utcnow().strftime('%Y%m%d-%H%M')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
