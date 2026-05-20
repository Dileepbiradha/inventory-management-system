"""
Script to make a user an admin.
Run from backend folder: python make_admin.py
"""
from app.database import SessionLocal
from app.models.user import User

# 👇 Change this to your username if different
USERNAME = "testuser3"

db = SessionLocal()

try:
    user = db.query(User).filter(User.username == USERNAME).first()
    
    if user:
        print(f"📋 Found user: {user.username}")
        print(f"   Current is_admin: {user.is_admin}")
        
        user.is_admin = True
        db.commit()
        db.refresh(user)
        
        print(f"\n✅ SUCCESS! User '{user.username}' is now an admin.")
        print(f"   New is_admin: {user.is_admin}")
    else:
        print(f"❌ User '{USERNAME}' not found in database.")
        
        # Show all users to help debug
        all_users = db.query(User).all()
        print(f"\n📋 Users in database:")
        for u in all_users:
            print(f"   - {u.username} (id: {u.id}, admin: {u.is_admin})")
finally:
    db.close()