from pydantic import BaseModel, Field, field_validator
import re


class AddressCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., max_length=15)
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    pincode: str = Field(..., min_length=4, max_length=10)
    is_default: bool = False

    @field_validator("pincode")
    @classmethod
    def pincode_format(cls, v):
        if not re.match(r"^\d{4,10}$", v):
            raise ValueError("Pincode must be 4-10 digits")
        return v


class AddressUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=120)
    phone: str | None = Field(None, max_length=15)
    address_line1: str | None = Field(None, min_length=1, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, min_length=1, max_length=100)
    state: str | None = Field(None, min_length=1, max_length=100)
    pincode: str | None = Field(None, min_length=4, max_length=10)
    is_default: bool | None = None


class AddressOut(BaseModel):
    id: int
    full_name: str
    phone: str
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    pincode: str
    is_default: bool

    model_config = {"from_attributes": True}
