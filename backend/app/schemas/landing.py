from pydantic import BaseModel, Field


class SectionImageBase(BaseModel):
    image_url: str = Field(..., min_length=1, max_length=500)
    media_type: str = Field("image", pattern="^(image|video)$")
    kicker: str | None = Field(None, max_length=120)
    title: str | None = Field(None, max_length=200)
    body: str | None = None
    sort_order: int = 0


class SectionImageCreate(SectionImageBase):
    pass


class SectionImageUpdate(BaseModel):
    image_url: str | None = Field(None, min_length=1, max_length=500)
    media_type: str | None = Field(None, pattern="^(image|video)$")
    kicker: str | None = Field(None, max_length=120)
    title: str | None = Field(None, max_length=200)
    body: str | None = None
    sort_order: int | None = None


class SectionImageOut(SectionImageBase):
    id: int
    section_id: int
    model_config = {"from_attributes": True}


class LandingSectionBase(BaseModel):
    key: str = Field(..., min_length=1, max_length=64)
    kind: str = Field("builtin", max_length=32)
    title: str | None = Field(None, max_length=200)
    subtitle: str | None = Field(None, max_length=500)
    sort_order: int = 0
    is_active: bool = True
    full_viewport: bool = False


class LandingSectionCreate(BaseModel):
    key: str | None = Field(None, max_length=64)  # server assigns for galleries
    kind: str = Field("gallery", max_length=32)
    title: str | None = Field(None, max_length=200)
    subtitle: str | None = Field(None, max_length=500)


class LandingSectionUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    subtitle: str | None = Field(None, max_length=500)
    is_active: bool | None = None
    sort_order: int | None = None
    full_viewport: bool | None = None


class LandingSectionOut(LandingSectionBase):
    id: int
    images: list[SectionImageOut] = []
    model_config = {"from_attributes": True}


class ReorderBody(BaseModel):
    order: list[int]


class UploadOut(BaseModel):
    url: str
    media_type: str  # "image" | "video"
