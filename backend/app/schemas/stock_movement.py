from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime
from app.models.stock_movement import MovementType


# ==================== BASE ====================
class StockMovementBase(BaseModel):
    """Common fields shared by create/response schemas."""
    movement_type: MovementType
    quantity: int
    reason: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    unit_cost: Optional[float] = Field(default=None, ge=0)


# ==================== CREATE ====================
class StockMovementCreate(StockMovementBase):
    product_id: int

    @model_validator(mode="after")
    def _check_quantity(self):
        if self.movement_type in (MovementType.IN, MovementType.OUT) and self.quantity <= 0:
            raise ValueError(f"{self.movement_type.value} movement requires quantity > 0")
        if self.movement_type == MovementType.ADJUSTMENT and self.quantity == 0:
            raise ValueError("ADJUSTMENT cannot be zero (use a positive or negative delta)")
        return self


# ==================== RESPONSE ====================
class StockMovementResponse(StockMovementBase):
    id: int
    product_id: int
    user_id: Optional[int] = None
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