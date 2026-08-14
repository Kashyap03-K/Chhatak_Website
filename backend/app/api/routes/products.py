import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_admin
from app.models.product import Product
from app.schemas.product import ProductOut, ProductCreate, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _parse_images(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        v = json.loads(raw)
        return [str(x) for x in v if x]
    except Exception:
        return []


def _serialize(product: Product) -> dict:
    images = _parse_images(product.images_json)
    # Back-fill from legacy image_url if the gallery list is empty.
    if not images and product.image_url:
        images = [product.image_url]
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "long_description": product.long_description,
        "price": product.price,
        "compare_at_price": product.compare_at_price,
        "weight": product.weight,
        "image_url": product.image_url,
        "images": images,
        "model_url": product.model_url,
        "category": product.category,
        "flavor": product.flavor,
        "stock": product.stock,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
    }


def _apply_images(product: Product, images: list[str] | None, explicit_image_url: str | None, image_url_set: bool):
    """Sync the gallery list and cover image. The cover mirrors images[0]."""
    if images is not None:
        cleaned = [u for u in (images or []) if u]
        product.images_json = json.dumps(cleaned) if cleaned else None
        if cleaned:
            product.image_url = cleaned[0]
        elif not image_url_set:
            product.image_url = None
    elif image_url_set:
        # Legacy single-image edit path: cover set, wipe gallery (or seed it with the cover).
        product.image_url = explicit_image_url
        product.images_json = json.dumps([explicit_image_url]) if explicit_image_url else None


@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return [_serialize(p) for p in db.query(Product).filter(Product.is_active == True).all()]


@router.get("/slug/{slug}", response_model=ProductOut)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize(product)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize(product)


@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProductCreate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    data = body.model_dump()
    images = data.pop("images", None)
    product = Product(**data)
    _apply_images(product, images, product.image_url, image_url_set=True)
    db.add(product)
    db.commit()
    db.refresh(product)
    return _serialize(product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, body: ProductUpdate, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    data = body.model_dump(exclude_unset=True)
    images = data.pop("images", None) if "images" in data else None
    image_url_set = "image_url" in data
    explicit_image_url = data.pop("image_url", None) if image_url_set else None
    for key, value in data.items():
        setattr(product, key, value)
    if images is not None or image_url_set:
        _apply_images(product, images, explicit_image_url, image_url_set)
    db.commit()
    db.refresh(product)
    return _serialize(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), _=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.commit()
