from app.database import SessionLocal, engine, Base
from app.models.user import User

# Make sure tables exist
Base.metadata.create_all(bind=engine)

# Try to import the password hashing function
try:
    from app.core.security import get_password_hash
except ImportError:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    def get_password_hash(password):
        return pwd_context.hash(password)

db = SessionLocal()

# Check if admin already exists
existing = db.query(User).filter(User.username == "admin").first()
if existing:
    print("⚠️  Admin user already exists. Updating password...")
    existing.hashed_password = get_password_hash("Admin@123")
    db.commit()
    print("✅ Password reset to: Admin@123")
else:
    new_user = User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("Admin@123"),
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    print("✅ Admin user created!")
    print("   Username: admin")
    print("   Password: Admin@123")

db.close()