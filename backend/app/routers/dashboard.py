from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.core.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_products = db.query(func.count(Product.id)).scalar() or 0

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.quantity <= Product.min_stock_level)
        .scalar()
        or 0
    )

    total_inventory_value = (
        db.query(func.sum(Product.price * Product.quantity)).scalar() or 0
    )

    total_movements = db.query(func.count(StockMovement.id)).scalar() or 0

    return {
        "total_products": total_products,
        "low_stock_count": low_stock_count,
        "total_inventory_value": float(total_inventory_value),
        "total_movements": total_movements,
    }


@router.get("/low-stock")
def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = (
        db.query(Product)
        .filter(Product.quantity <= Product.min_stock_level)
        .order_by(Product.quantity.asc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "quantity": p.quantity,
            "min_stock_level": p.min_stock_level,
            "unit": p.unit,
        }
        for p in products
    ]


@router.get("/recent-transactions")
def get_recent_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movements = (
        db.query(StockMovement)
        .order_by(StockMovement.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": m.id,
            "product_id": m.product_id,
            "product_name": m.product.name if m.product else "Unknown",
            "movement_type": m.movement_type.value if m.movement_type else None,
            "quantity": m.quantity,
            "reason": m.reason,
            "created_at": m.created_at,
        }
        for m in movements
    ]