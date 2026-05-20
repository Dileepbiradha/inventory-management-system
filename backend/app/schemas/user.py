from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime


# ============================================
# 👤 USER BASE SCHEMA
# ============================================
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None


# ============================================
# 📝 USER CREATE SCHEMA (Registration)
# ============================================
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


# ============================================
# 🔄 USER UPDATE SCHEMA
# ============================================
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================
# 📤 USER RESPONSE SCHEMA
# ============================================
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================
# 🔐 LOGIN SCHEMA
# ============================================
class UserLogin(BaseModel):
    username: str
    password: str


# ============================================
# 🎫 TOKEN SCHEMAS
# ============================================
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


# ============================================
# 🔑 PASSWORD RESET SCHEMAS (NEW!)
# ============================================

# 📧 Step 1: User requests password reset (sends email)
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


# 🔄 Step 2: User submits new password with token
class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


# 🔁 Step 3: User changes password while logged in (BONUS)
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_password: str = Field(..., min_length=6, max_length=100)

    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


# ============================================
# 💬 GENERIC MESSAGE RESPONSE
# ============================================
class MessageResponse(BaseModel):
    message: str
    success: bool = True
    # ============================================
# 📧 EMAIL VERIFICATION SCHEMAS (NEW!)
# ============================================

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10)


class ResendVerificationRequest(BaseModel):
    email: EmailStr
    
class UserResponse(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    is_verified: bool          # 🆕 added
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================
# 📧 EMAIL VERIFICATION SCHEMAS
# ============================================

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10)


class ResendVerificationRequest(BaseModel):
    email: EmailStr