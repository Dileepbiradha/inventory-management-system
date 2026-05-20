from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


# Shared fields
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# For creating a new supplier (POST)
class SupplierCreate(SupplierBase):
    pass


# For updating a supplier (PUT) — all fields optional
class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None


# For sending data back to the user (Response)
class SupplierResponse(SupplierBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)