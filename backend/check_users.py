from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()

print("\n" + "=" * 60)
print("📋 REGISTERED USERS")
print("=" * 60)

if not users:
    print("❌ No users found in database!")
else:
    for user in users:
        print(f"\n🆔 ID: {user.id}")
        print(f"👤 Username: {user.username}")
        print(f"📧 Email: {user.email}")
        print(f"✅ Active: {user.is_active}")
        print("-" * 60)

print(f"\n📊 Total users: {len(users)}\n")
db.close()