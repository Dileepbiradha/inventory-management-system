from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.stock_movement import StockMovement, MovementType
from app.schemas.stock_movement import (
    StockMovementCreate,
    StockMovementResponse,
    StockMovementWithDetails,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/movements", tags=["movements"])


# ==================== LIST WITH FILTERS ====================
@router.get("", response_model=List[StockMovementWithDetails])  # 👈 changed
def list_movements(
    skip: int = 0,
    limit: int = Query(50, le=200),
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List stock movements with optional filters."""
    query = db.query(StockMovement).options(
        joinedload(StockMovement.product),
        joinedload(StockMovement.user),
    )

    if product_id is not None:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type is not None:
        query = query.filter(StockMovement.movement_type == movement_type)
    if start_date is not None:
        query = query.filter(StockMovement.created_at >= start_date)
    if end_date is not None:
        query = query.filter(StockMovement.created_at <= end_date)

    movements = (
        query.order_by(desc(StockMovement.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []
    for m in movements:
        result.append(
            StockMovementWithDetails(
                id=m.id,
                product_id=m.product_id,
                user_id=m.user_id,
                movement_type=m.movement_type,
                quantity=m.quantity,
                reason=m.reason,
                reference=m.reference,
                notes=m.notes,
                unit_cost=m.unit_cost,
                total_cost=m.total_cost,
                quantity_before=m.quantity_before,
                quantity_after=m.quantity_after,
                created_at=m.created_at,
                product_name=m.product.name if m.product else None,
                product_sku=m.product.sku if m.product else None,
                user_username=m.user.username if m.user else None,
            )
        )
    return result


# ==================== COUNT (for pagination) ====================
@router.get("/count")
def count_movements(
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StockMovement)
    if product_id is not None:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type is not None:
        query = query.filter(StockMovement.movement_type == movement_type)
    return {"count": query.count()}


# ==================== GET ONE ====================
@router.get("/{movement_id}", response_model=StockMovementWithDetails)
def get_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    m = (
        db.query(StockMovement)
        .options(joinedload(StockMovement.product), joinedload(StockMovement.user))
        .filter(StockMovement.id == movement_id)
        .first()
    )
    if not m:
        raise HTTPException(status_code=404, detail="Movement not found")

    return StockMovementWithDetails(
        id=m.id,
        product_id=m.product_id,
        user_id=m.user_id,
        movement_type=m.movement_type,
        quantity=m.quantity,
        reason=m.reason,
        reference=m.reference,
        notes=m.notes,
        unit_cost=m.unit_cost,
        total_cost=m.total_cost,
        quantity_before=m.quantity_before,
        quantity_after=m.quantity_after,
        created_at=m.created_at,
        product_name=m.product.name if m.product else None,
        product_sku=m.product.sku if m.product else None,
        user_username=m.user.username if m.user else None,
    )


# ==================== CREATE ====================
@router.post(
    "", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED  # 👈 changed
)
def create_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a stock movement and automatically update the product's stock.
    - IN          → adds `quantity` to product (quantity must be > 0)
    - OUT         → subtracts `quantity` (must be > 0, and <= current stock)
    - ADJUSTMENT  → applies a SIGNED DELTA:
                       +5  = add 5 units (e.g. found extra)
                       -5  = remove 5 units (e.g. damaged)
                        0  = rejected
    """
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    quantity_before = product.quantity

    # ---------- IN ----------
    if payload.movement_type == MovementType.IN:
        if payload.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="IN movement requires a positive quantity.",
            )
        quantity_after = quantity_before + payload.quantity

    # ---------- OUT ----------
    elif payload.movement_type == MovementType.OUT:
        if payload.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="OUT movement requires a positive quantity.",
            )
        if payload.quantity > quantity_before:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {quantity_before}",
            )
        quantity_after = quantity_before - payload.quantity

    # ---------- ADJUSTMENT (signed delta) ----------
    else:
        if payload.quantity == 0:
            raise HTTPException(
                status_code=400,
                detail="ADJUSTMENT cannot be zero. Use a positive or negative number.",
            )
        quantity_after = quantity_before + payload.quantity
        if quantity_after < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Adjustment would result in negative stock. "
                    f"Current: {quantity_before}, requested delta: {payload.quantity}"
                ),
            )

    # Calculate total cost (only meaningful for IN movements with positive quantity)
    total_cost = None
    if payload.unit_cost is not None and payload.quantity > 0:
        total_cost = round(payload.unit_cost * payload.quantity, 2)

    movement = StockMovement(
        product_id=payload.product_id,
        user_id=current_user.id,
        movement_type=payload.movement_type,
        quantity=payload.quantity,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        reason=payload.reason,
        reference=payload.reference,
        notes=payload.notes,
        unit_cost=payload.unit_cost,
        total_cost=total_cost,
    )

    # Update product stock
    product.quantity = quantity_after

    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


# ==================== PRODUCT HISTORY ====================
@router.get(
    "/product/{product_id}/history", response_model=List[StockMovementWithDetails]
)
def product_history(
    product_id: int,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = (
        db.query(StockMovement)
        .options(joinedload(StockMovement.user))
        .filter(StockMovement.product_id == product_id)
        .order_by(desc(StockMovement.created_at))
        .limit(limit)
        .all()
    )

    return [
        StockMovementWithDetails(
            id=m.id,
            product_id=m.product_id,
            user_id=m.user_id,
            movement_type=m.movement_type,
            quantity=m.quantity,
            reason=m.reason,
            reference=m.reference,
            notes=m.notes,
            unit_cost=m.unit_cost,
            total_cost=m.total_cost,
            quantity_before=m.quantity_before,
            quantity_after=m.quantity_after,
            created_at=m.created_at,
            product_name=product.name,
            product_sku=product.sku,
            user_username=m.user.username if m.user else None,
        )
        for m in movements
    ]