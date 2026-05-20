from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.crud import category as category_crud
from app.core.dependencies import get_current_active_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/categories", tags=["categories"])

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new category (Admin only)"""
    return category_crud.create_category(db=db, category=category)


@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all categories"""
    return category_crud.get_categories(db=db, skip=skip, limit=limit)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single category by ID"""
    return category_crud.get_category(db=db, category_id=category_id)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a category (Admin only)"""
    return category_crud.update_category(
        db=db, category_id=category_id, category_update=category_update
    )


@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a category (Admin only)"""
    return category_crud.delete_category(db=db, category_id=category_id)