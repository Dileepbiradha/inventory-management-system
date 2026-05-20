from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.crud import supplier as supplier_crud
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/suppliers", tags=["suppliers"])

@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check if email already exists
    if supplier.email:
        existing = supplier_crud.get_supplier_by_email(db, supplier.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A supplier with this email already exists.",
            )
    return supplier_crud.create_supplier(db, supplier)


@router.get("/", response_model=List[SupplierResponse])
def get_all_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return supplier_crud.get_suppliers(db, skip=skip, limit=limit)


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = supplier_crud.get_supplier(db, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = supplier_crud.update_supplier(db, supplier_id, supplier_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return updated


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = supplier_crud.delete_supplier(db, supplier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return None