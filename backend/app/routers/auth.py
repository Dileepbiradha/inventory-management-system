from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    MessageResponse,
    VerifyEmailRequest,
    ResendVerificationRequest,
)
from app.crud import user as user_crud
from app.core.security import create_access_token, get_current_user
from app.core.config import settings
from app.services.email_service import (
    send_password_reset_email,
    send_password_changed_notification,
    send_verification_email,
)
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["auth"])

# ============================================
# 📝 REGISTER
# ============================================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Register a new user and send a verification email."""

    if user_crud.get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    if user_crud.get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = user_crud.create_user(db, user)

    # 📧 Send verification email in background
    background_tasks.add_task(
        send_verification_email,
        email=new_user.email,
        username=new_user.username,
        verification_token=new_user.verification_token,
    )

    return new_user


# ============================================
# 🔐 LOGIN
# ============================================
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """Login and return JWT token (only if verified)."""

    user = user_crud.authenticate_user(db, form_data.username, form_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # 🚫 Block unverified accounts
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for the verification link.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


# ============================================
# 👤 GET CURRENT USER
# ============================================
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ============================================
# ✅ VERIFY EMAIL (GET — direct link from email)
# ============================================
@router.get("/verify-email/{token}", response_model=MessageResponse)
def verify_email_get(token: str, db: Session = Depends(get_db)):
    """Verify email using token from email link."""
    user = user_crud.verify_email_token(db, token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    return MessageResponse(
        message="Email verified successfully! You can now log in.",
        success=True,
    )


# ============================================
# ✅ VERIFY EMAIL (POST — for SPA frontends)
# ============================================
@router.post("/verify-email", response_model=MessageResponse)
def verify_email_post(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db),
):
    """Verify email using token (POST version)."""
    user = user_crud.verify_email_token(db, request.token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    return MessageResponse(
        message="Email verified successfully! You can now log in.",
        success=True,
    )


# ============================================
# 🔁 RESEND VERIFICATION EMAIL
# ============================================
@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Resend the email verification link."""

    result = user_crud.regenerate_verification_token(db, request.email)

    if result and not result["already_verified"] and result["token"]:
        user = result["user"]
        background_tasks.add_task(
            send_verification_email,
            email=user.email,
            username=user.username,
            verification_token=result["token"],
        )

    return MessageResponse(
        message="If your email exists and is unverified, a new verification link has been sent.",
        success=True,
    )


# ============================================
# 🔑 FORGOT PASSWORD
# ============================================
@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    result = user_crud.create_password_reset_token(db, request.email)

    if result:
        user = result["user"]
        token = result["token"]
        background_tasks.add_task(
            send_password_reset_email,
            email=user.email,
            username=user.username,
            reset_token=token,
        )

    return MessageResponse(
        message="If the email exists in our system, you will receive a password reset link shortly.",
        success=True,
    )


# ============================================
# ✅ VERIFY RESET TOKEN
# ============================================
@router.get("/verify-reset-token/{token}", response_model=MessageResponse)
def verify_reset_token(token: str, db: Session = Depends(get_db)):
    user = user_crud.verify_reset_token(db, token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return MessageResponse(message="Token is valid", success=True)


# ============================================
# 🔄 RESET PASSWORD
# ============================================
@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    user = user_crud.reset_user_password(
        db,
        token=request.token,
        new_password=request.new_password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    background_tasks.add_task(
        send_password_changed_notification,
        email=user.email,
        username=user.username,
    )

    return MessageResponse(
        message="Password has been reset successfully. You can now login with your new password.",
        success=True,
    )


# ============================================
# 🔁 CHANGE PASSWORD
# ============================================
@router.post("/change-password", response_model=MessageResponse)
def change_password(
    request: ChangePasswordRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match",
        )

    if request.current_password == request.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password",
        )

    user = user_crud.change_user_password(
        db,
        user_id=current_user.id,
        current_password=request.current_password,
        new_password=request.new_password,
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    background_tasks.add_task(
        send_password_changed_notification,
        email=user.email,
        username=user.username,
    )

    return MessageResponse(message="Password changed successfully.", success=True)