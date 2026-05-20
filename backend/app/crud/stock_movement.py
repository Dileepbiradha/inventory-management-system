from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.stock_movement import StockMovement
from app.models.product import Product
from app.schemas.stock_movement import StockMovementCreate
from typing import Optional, List


def get_stock_movement(db: Session, movement_id: int) -> Optional[StockMovement]:
    return db.query(StockMovement).filter(StockMovement.id == movement_id).first()


def get_stock_movements(db: Session, skip: int = 0, limit: int = 100) -> List[StockMovement]:
    return db.query(StockMovement).order_by(StockMovement.created_at.desc()).offset(skip).limit(limit).all()


def get_movements_by_product(db: Session, product_id: int) -> List[StockMovement]:
    return db.query(StockMovement).filter(StockMovement.product_id == product_id).order_by(StockMovement.created_at.desc()).all()


def create_stock_movement(db: Session, movement: StockMovementCreate, user_id: Optional[int] = None) -> StockMovement:
    # Get the product
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update product quantity based on movement type
    if movement.movement_type == "in":
        product.quantity += movement.quantity
    elif movement.movement_type == "out":
        if product.quantity < movement.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        product.quantity -= movement.quantity
    elif movement.movement_type == "adjustment":
        product.quantity = movement.quantity
    else:
        raise HTTPException(status_code=400, detail="Invalid movement type. Must be 'in', 'out', or 'adjustment'")

    # Create the movement record
    db_movement = StockMovement(
        product_id=movement.product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        reference=movement.reference,
        notes=movement.notes,
        user_id=user_id,
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement