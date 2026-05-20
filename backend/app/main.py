from fastapi import FastAPI
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import get_password_hash

app = FastAPI()

# ... your existing code (CORS, routers, etc.) ...

@app.on_event("startup")
def create_admin_user():
    """Auto-create admin user on startup if it doesn't exist"""
    Base.metadata.create_all(bind=engine)  # Ensure tables exist
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            new_admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("✅ Admin user created on startup")
        else:
            # Reset password every deploy (optional - remove later)
            admin.hashed_password = get_password_hash("admin123")
            admin.is_active = True
            db.commit()
            print("✅ Admin password reset on startup")
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    finally:
        db.close()