from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class MovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)  # Always positive
    
    # Stock levels for tracking
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    
    # Optional details
    reason = Column(String(255), nullable=True)  # "Purchase", "Sale", "Damage", etc.
    reference = Column(String(100), nullable=True)  # Invoice/PO number
    notes = Column(Text, nullable=True)
    
    # Cost tracking (for IN movements)
    unit_cost = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")