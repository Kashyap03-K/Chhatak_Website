import os
import re
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.landing import LandingSection, SectionImage
from app.schemas.landing import (
    LandingSectionOut, LandingSectionCreate, LandingSectionUpdate,
    SectionImageOut, SectionImageCreate, SectionImageUpdate,
    ReorderBody, UploadOut,
)

router = APIRouter(prefix="/landing", tags=["landing"])
uploads_router = APIRouter(prefix="/uploads", tags=["uploads"])


UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
VIDEO_EXTS = {".mp4", ".webm", ".mov", ".m4v", ".ogv"}
ALLOWED_EXTS = IMAGE_EXTS | VIDEO_EXTS
MAX_IMAGE_BYTES = 45 * 1024 * 1024  # 45 MB
MAX_VIDEO_BYTES = 60 * 1024 * 1024  # 60 MB
SAFE_NAME_RE = re.compile(r"[^a-zA-Z0-9._-]+")


# ---------- Public ----------

@router.get("/sections", response_model=list[LandingSectionOut])
def list_sections_public(db: Session = Depends(get_db)):
    return (
        db.query(LandingSection)
        .filter(LandingSection.is_active == True)
        .order_by(LandingSection.sort_order.asc(), LandingSection.id.asc())
        .all()
    )


# ---------- Admin: sections ----------

@router.get("/admin/sections", response_model=list[LandingSectionOut])
def list_sections_admin(db: Session = Depends(get_db), _=Depends(get_current_admin)):
    return (
        db.query(LandingSection)
        .order_by(LandingSection.sort_order.asc(), LandingSection.id.asc())
        .all()
    )


@router.post("/admin/sections", response_model=LandingSectionOut, status_code=status.HTTP_201_CREATED)
def create_section(body: LandingSectionCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    if body.kind != "gallery":
        raise HTTPException(status_code=400, detail="Only 'gallery' sections can be created")
    key = body.key
    if not key:
        n = db.query(LandingSection).filter(LandingSection.kind == "gallery").count() + 1
        while db.query(LandingSection).filter(LandingSection.key == f"gallery-{n}").first():
            n += 1
        key = f"gallery-{n}"
    if db.query(LandingSection).filter(LandingSection.key == key).first():
        raise HTTPException(status_code=400, detail="Section key already exists")
    max_order = db.query(LandingSection).order_by(LandingSection.sort_order.desc()).first()
    next_order = (max_order.sort_order + 1) if max_order else 0
    section = LandingSection(
        key=key, kind="gallery", title=body.title, subtitle=body.subtitle,
        sort_order=next_order, is_active=True,
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.put("/admin/sections/reorder")
def reorder_sections(body: ReorderBody, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    for idx, sid in enumerate(body.order):
        db.query(LandingSection).filter(LandingSection.id == sid).update({"sort_order": idx})
    db.commit()
    return {"ok": True}


@router.put("/admin/sections/{section_id}", response_model=LandingSectionOut)
def update_section(section_id: int, body: LandingSectionUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    section = db.query(LandingSection).filter(LandingSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(section, k, v)
    db.commit()
    db.refresh(section)
    return section


@router.delete("/admin/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(section_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    section = db.query(LandingSection).filter(LandingSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(section)
    db.commit()


# ---------- Admin: section images ----------

@router.post("/admin/sections/{section_id}/images", response_model=SectionImageOut, status_code=status.HTTP_201_CREATED)
def add_image(section_id: int, body: SectionImageCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    section = db.query(LandingSection).filter(LandingSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    max_img = db.query(SectionImage).filter(SectionImage.section_id == section_id).order_by(SectionImage.sort_order.desc()).first()
    next_order = (max_img.sort_order + 1) if max_img else 0
    img = SectionImage(
        section_id=section_id,
        image_url=body.image_url,
        media_type=body.media_type,
        kicker=body.kicker,
        title=body.title,
        body=body.body,
        sort_order=body.sort_order if body.sort_order else next_order,
    )
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.put("/admin/images/{image_id}", response_model=SectionImageOut)
def update_image(image_id: int, body: SectionImageUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    img = db.query(SectionImage).filter(SectionImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(img, k, v)
    db.commit()
    db.refresh(img)
    return img


@router.delete("/admin/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    img = db.query(SectionImage).filter(SectionImage.id == image_id).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(img)
    db.commit()


@router.put("/admin/sections/{section_id}/images/reorder")
def reorder_images(section_id: int, body: ReorderBody, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    for idx, iid in enumerate(body.order):
        db.query(SectionImage).filter(
            SectionImage.id == iid, SectionImage.section_id == section_id
        ).update({"sort_order": idx})
    db.commit()
    return {"ok": True}


# ---------- Upload ----------

@uploads_router.post("/image", response_model=UploadOut)
async def upload_image(file: UploadFile = File(...), _=Depends(get_current_admin)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
    media_type = "video" if ext in VIDEO_EXTS else "image"
    limit = MAX_VIDEO_BYTES if media_type == "video" else MAX_IMAGE_BYTES
    contents = await file.read()
    if len(contents) > limit:
        mb = limit // (1024 * 1024)
        raise HTTPException(status_code=400, detail=f"File too large (max {mb} MB)")
    safe_stem = SAFE_NAME_RE.sub("-", Path(file.filename or "media").stem)[:60] or "media"
    name = f"{safe_stem}-{secrets.token_hex(6)}{ext}"
    dest = UPLOAD_DIR / name
    dest.write_bytes(contents)
    return {"url": f"/uploads/{name}", "media_type": media_type}
