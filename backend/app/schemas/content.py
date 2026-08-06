from pydantic import BaseModel, Field


class ReelBase(BaseModel):
    video_url: str | None = Field(None, max_length=500)
    poster_url: str | None = Field(None, max_length=500)
    shortcode: str | None = Field(None, min_length=1, max_length=64)
    caption: str | None = Field(None, max_length=280)
    is_active: bool = True
    sort_order: int = 0


class ReelCreate(ReelBase):
    pass


class ReelUpdate(BaseModel):
    video_url: str | None = Field(None, max_length=500)
    poster_url: str | None = Field(None, max_length=500)
    shortcode: str | None = Field(None, min_length=1, max_length=64)
    caption: str | None = Field(None, max_length=280)
    is_active: bool | None = None
    sort_order: int | None = None


class ReelOut(ReelBase):
    id: int
    model_config = {"from_attributes": True}


class ReviewBase(BaseModel):
    author: str = Field(..., min_length=1, max_length=120)
    handle: str | None = Field(None, max_length=120)
    location: str | None = Field(None, max_length=120)
    rating: int = Field(5, ge=1, le=5)
    quote: str = Field(..., min_length=1, max_length=1000)
    is_active: bool = True
    sort_order: int = 0


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    author: str | None = Field(None, min_length=1, max_length=120)
    handle: str | None = Field(None, max_length=120)
    location: str | None = Field(None, max_length=120)
    rating: int | None = Field(None, ge=1, le=5)
    quote: str | None = Field(None, min_length=1, max_length=1000)
    is_active: bool | None = None
    sort_order: int | None = None


class ReviewOut(ReviewBase):
    id: int
    model_config = {"from_attributes": True}
