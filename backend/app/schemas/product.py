from pydantic import BaseModel, Field, field_validator


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    price: float = Field(..., gt=0, le=100000)
    compare_at_price: float | None = Field(None, gt=0, le=100000)
    weight: str = Field("100g", max_length=50)
    image_url: str | None = Field(None, max_length=500)
    model_url: str | None = Field(None, max_length=500)
    category: str = Field("snacks", max_length=100)
    flavor: str | None = Field(None, max_length=100)
    stock: int = Field(0, ge=0, le=100000)
    is_active: bool = True
    is_featured: bool = False

    @field_validator("slug")
    @classmethod
    def slug_format(cls, v):
        import re
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens")
        return v


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    price: float | None = Field(None, gt=0, le=100000)
    compare_at_price: float | None = Field(None, gt=0, le=100000)
    weight: str | None = Field(None, max_length=50)
    image_url: str | None = Field(None, max_length=500)
    model_url: str | None = Field(None, max_length=500)
    stock: int | None = Field(None, ge=0, le=100000)
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
