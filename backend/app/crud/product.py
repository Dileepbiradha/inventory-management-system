from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from typing import Optional, List


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_sku(db: Session, sku: str) -> Optional[Product]:
    return db.query(Product).filter(Product.sku == sku).first()


def get_products(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    low_stock: bool = False,
) -> List[Product]:
    query = db.query(Product)

    if search:
        query = query.filter(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%"))
        )

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if supplier_id is not None:
        query = query.filter(Product.supplier_id == supplier_id)

    if low_stock:
        query = query.filter(Product.quantity <= Product.min_stock_level)

    return query.offset(skip).limit(limit).all()


def get_low_stock_products(db: Session) -> List[Product]:
    return db.query(Product).filter(Product.quantity <= Product.min_stock_level).all()


def create_product(db: Session, product: ProductCreate) -> Product:
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product_update: ProductUpdate) -> Optional[Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None

    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True