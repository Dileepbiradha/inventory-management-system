from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.stock_movement import MovementType


# ==================== BASE ====================
class StockMovementBase(BaseModel):
    movement_type: MovementType
    quantity: int = Field(..., gt=0, description="Must be positive")
    reason: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    unit_cost: Optional[float] = Field(None, ge=0)


# ==================== CREATE ====================
class StockMovementCreate(StockMovementBase):
    product_id: int


# ==================== RESPONSE ====================
class StockMovementResponse(StockMovementBase):
    id: int
    product_id: int
    user_id: int
    quantity_before: int
    quantity_after: int
    total_cost: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== WITH DETAILS ====================
class StockMovementWithDetails(StockMovementResponse):
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    user_username: Optional[str] = None