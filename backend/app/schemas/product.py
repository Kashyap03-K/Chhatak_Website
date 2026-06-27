from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None
    price: float
    compare_at_price: float | None = None
    weight: str = "100g"
    image_url: str | None = None
    model_url: str | None = None
    category: str = "snacks"
    flavor: str | None = None
    stock: int = 0
    is_active: bool = True
    is_featured: bool = False


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    compare_at_price: float | None = None
    weight: str | None = None
    image_url: str | None = None
    model_url: str | None = None
    stock: int | None = None
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: float
    compare_at_price: float | None
    weight: str
    image_url: str | None
    model_url: str | None
    category: str
    flavor: str | None
    stock: int
    is_active: bool
    is_featured: bool

    model_config = {"from_attributes": True}
