import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production-please")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")

    # App Info
    APP_NAME: str = "Inventory Management System"
    APP_VERSION: str = "1.0.0"

    # ============================================
    # 📧 EMAIL SETTINGS (NEW)
    # ============================================
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD", "")
    MAIL_FROM: str = os.getenv("MAIL_FROM", "")
    MAIL_FROM_NAME: str = os.getenv("MAIL_FROM_NAME", "Inventory Management System")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", "587"))
    MAIL_SERVER: str = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_STARTTLS: bool = os.getenv("MAIL_STARTTLS", "True").lower() == "true"
    MAIL_SSL_TLS: bool = os.getenv("MAIL_SSL_TLS", "False").lower() == "true"

    # 🔗 Frontend URL (for password reset links)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # ⏰ Password Reset Token Expire (in minutes)
    RESET_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("RESET_TOKEN_EXPIRE_MINUTES", "30"))
    
    # ⏰ Email Verification Token Expire (in minutes) — typically 24 hours
    VERIFICATION_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("VERIFICATION_TOKEN_EXPIRE_MINUTES", "1440"))

settings = Settings()