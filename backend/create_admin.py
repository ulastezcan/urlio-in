#!/usr/bin/env python3
"""
Create admin user for urlio.in
Admin credentials:
Username: admin
Password: Admin@2025!Urlio
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, User
from app.utils.auth import hash_password

def create_admin():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("❌ Admin user already exists!")
            print(f"   Username: {existing_admin.username}")
            print(f"   Email: {existing_admin.email}")
            print(f"   Is Admin: {existing_admin.is_admin}")
            return
        
        # Create admin user
        admin_password = "Admin@2025!Urlio"
        
        admin_user = User(
            username="admin",
            email="admin@urlio.in",
            password_hash=hash_password(admin_password),
            preferred_language="tr",
            is_admin=True,
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print("")
        print("=" * 50)
        print("ADMIN CREDENTIALS")
        print("=" * 50)
        print(f"Username: admin")
        print(f"Password: {admin_password}")
        print(f"Email: admin@urlio.in")
        print("=" * 50)
        print("")
        print("⚠️  IMPORTANT: Please change the password after first login!")
        print("")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
