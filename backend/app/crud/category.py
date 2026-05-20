from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


def get_category(db: Session, category_id: int):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with id {category_id} not found"
        )
    return category


def get_category_by_name(db: Session, name: str):
    return db.query(Category).filter(Category.name == name).first()


def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Category).offset(skip).limit(limit).all()


def create_category(db: Session, category: CategoryCreate):
    if get_category_by_name(db, category.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category.name}' already exists"
        )
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(db: Session, category_id: int, category_update: CategoryUpdate):
    db_category = get_category(db, category_id)
    update_data = category_update.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] != db_category.name:
        if get_category_by_name(db, update_data["name"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{update_data['name']}' already exists"
            )

    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    db_category = get_category(db, category_id)
    category_name = db_category.name
    db.delete(db_category)
    db.commit()
    return {"message": f"Category '{category_name}' deleted successfully"}