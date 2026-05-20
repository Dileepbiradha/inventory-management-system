from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    description: Optional[str] = None
    price: float = 0.0
    cost: Optional[float] = 0.0
    quantity: Optional[int] = 0
    min_stock_level: Optional[int] = 10
    unit: Optional[str] = "pcs"
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    quantity: Optional[int] = None
    min_stock_level: Optional[int] = None
    unit: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True