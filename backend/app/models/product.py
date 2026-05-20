from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False, default=0.0)
    cost = Column(Float, default=0.0)
    quantity = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=10)
    unit = Column(String(20), default="pcs")
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")