from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)

    # Status flags
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    role = Column(String, default="user", nullable=False)

    # 📧 Email verification
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String, nullable=True, index=True)
    verification_token_expires = Column(DateTime(timezone=True), nullable=True)

    # 🔑 Password reset
    reset_token = Column(String, nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    stock_movements = relationship("StockMovement", back_populates="user")