from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.stock_movement import StockMovement, MovementType
from app.models.product import Product
from app.schemas.stock_movement import StockMovementCreate
from typing import Optional, List


def get_stock_movement(db: Session, movement_id: int) -> Optional[StockMovement]:
    return db.query(StockMovement).filter(StockMovement.id == movement_id).first()


def get_stock_movements(db: Session, skip: int = 0, limit: int = 100) -> List[StockMovement]:
    return (
        db.query(StockMovement)
        .order_by(StockMovement.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_movements_by_product(db: Session, product_id: int) -> List[StockMovement]:
    return (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.created_at.desc())
        .all()
    )


def create_stock_movement(
    db: Session,
    movement: StockMovementCreate,
    user_id: Optional[int] = None,
) -> StockMovement:
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    quantity_before = product.quantity

    if movement.movement_type == MovementType.IN:
        if movement.quantity <= 0:
            raise HTTPException(status_code=400, detail="IN movement requires a positive quantity.")
        quantity_after = quantity_before + movement.quantity

    elif movement.movement_type == MovementType.OUT:
        if movement.quantity <= 0:
            raise HTTPException(status_code=400, detail="OUT movement requires a positive quantity.")
        if movement.quantity > quantity_before:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {quantity_before}")
        quantity_after = quantity_before - movement.quantity

    elif movement.movement_type == MovementType.ADJUSTMENT:
        if movement.quantity == 0:
            raise HTTPException(status_code=400, detail="ADJUSTMENT cannot be zero.")
        quantity_after = quantity_before + movement.quantity
        if quantity_after < 0:
            raise HTTPException(
                status_code=400,
                detail=f"Adjustment would result in negative stock. Current: {quantity_before}, requested delta: {movement.quantity}",
            )
    else:
        raise HTTPException(status_code=400, detail="Invalid movement type.")

    total_cost = None
    if movement.unit_cost is not None and movement.quantity > 0:
        total_cost = round(movement.unit_cost * movement.quantity, 2)

    db_movement = StockMovement(
        product_id=movement.product_id,
        user_id=user_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        reason=movement.reason,
        reference=movement.reference,
        notes=movement.notes,
        unit_cost=movement.unit_cost,
        total_cost=total_cost,
    )

    product.quantity = quantity_after

    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement