from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.core.security import get_current_user, require_manager_or_admin
from app.models.user import User
from app.schemas.product import ProductResponse, ProductCreate, ProductUpdate
from app.crud import product as product_crud

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return product_crud.get_products(
        db, skip=skip, limit=limit, search=search,
        category_id=category_id, low_stock=low_stock,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    prod = product_crud.get_product(db, product_id=product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    existing = product_crud.get_product_by_sku(db, sku=product.sku)
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    return product_crud.create_product(db=db, product=product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    prod = product_crud.update_product(db, product_id, product_update)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager_or_admin),
):
    success = product_crud.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return None