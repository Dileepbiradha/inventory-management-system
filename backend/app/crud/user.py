from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password
from app.core.config import settings


# ============================================
# 🔍 GET USER FUNCTIONS
# ============================================

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username_or_email(db: Session, identifier: str) -> Optional[User]:
    return db.query(User).filter(
        or_(User.username == identifier, User.email == identifier)
    ).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


# ============================================
# ➕ CREATE USER (with verification token)
# ============================================

def create_user(db: Session, user: UserCreate) -> User:
    """Create a new unverified user with a verification token."""
    hashed_pw = hash_password(user.password)

    # Generate verification token at signup
    verification_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.VERIFICATION_TOKEN_EXPIRE_MINUTES
    )

    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pw,
        is_active=True,
        is_admin=False,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=expires_at,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ============================================
# 🔄 UPDATE USER
# ============================================

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_user, field, value)

    db.commit()
    db.refresh(db_user)
    return db_user


# ============================================
# 🗑️ DELETE USER
# ============================================

def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user_by_id(db, user_id)
    if not db_user:
        return False

    db.delete(db_user)
    db.commit()
    return True


# ============================================
# 🔐 AUTHENTICATE USER
# ============================================

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username_or_email(db, username)

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


# ============================================
# 📧 EMAIL VERIFICATION FUNCTIONS
# ============================================

def create_verification_token(db: Session, user: User) -> str:
    """Generate and assign a verification token to an existing user."""
    verification_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.VERIFICATION_TOKEN_EXPIRE_MINUTES
    )

    user.verification_token = verification_token
    user.verification_token_expires = expires_at

    db.commit()
    db.refresh(user)

    return verification_token


def verify_email_token(db: Session, token: str) -> Optional[User]:
    """Verify email token. Mark user verified and clear token if valid."""
    user = db.query(User).filter(User.verification_token == token).first()

    if not user:
        return None

    if user.verification_token_expires is None:
        return None

    expires = user.verification_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        return None

    # ✅ Mark as verified, clear token (single use)
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None

    db.commit()
    db.refresh(user)

    return user


def regenerate_verification_token(db: Session, email: str) -> Optional[dict]:
    """Regenerate a verification token (resend flow)."""
    user = get_user_by_email(db, email)

    if not user:
        return None

    if user.is_verified:
        return {"user": user, "token": None, "already_verified": True}

    token = create_verification_token(db, user)
    return {"user": user, "token": token, "already_verified": False}


# ============================================
# 🔑 PASSWORD RESET FUNCTIONS
# ============================================

def create_password_reset_token(db: Session, email: str) -> Optional[dict]:
    user = get_user_by_email(db, email)

    if not user:
        return None

    reset_token = secrets.token_urlsafe(32)
    expire_minutes = settings.RESET_TOKEN_EXPIRE_MINUTES
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)

    user.reset_token = reset_token
    user.reset_token_expires = expires_at

    db.commit()
    db.refresh(user)

    return {"user": user, "token": reset_token, "expires_at": expires_at}


def verify_reset_token(db: Session, token: str) -> Optional[User]:
    user = db.query(User).filter(User.reset_token == token).first()

    if not user:
        return None

    if user.reset_token_expires is None:
        return None

    expires = user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)

    if expires < datetime.now(timezone.utc):
        return None

    return user


def reset_user_password(db: Session, token: str, new_password: str) -> Optional[User]:
    user = verify_reset_token(db, token)

    if not user:
        return None

    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None

    db.commit()
    db.refresh(user)

    return user


def change_user_password(
    db: Session,
    user_id: int,
    current_password: str,
    new_password: str,
) -> Optional[User]:
    user = get_user_by_id(db, user_id)

    if not user:
        return None

    if not verify_password(current_password, user.hashed_password):
        return None

    user.hashed_password = hash_password(new_password)

    db.commit()
    db.refresh(user)

    return user


def clear_reset_token(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)

    if not user:
        return False

    user.reset_token = None
    user.reset_token_expires = None

    db.commit()
    return True