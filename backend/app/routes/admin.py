from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import Optional
from ..database import get_db, User, URL, URLVisit, UserWarning
from ..utils.auth import verify_token
from ..utils.helpers import hash_password
from ..utils.i18n import i18n

router = APIRouter(prefix="/admin", tags=["admin"])

class PasswordChange(BaseModel):
    new_password: str

class WarningMessage(BaseModel):
    user_id: int
    message: str
    url_id: Optional[int] = None

def get_admin_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Verify admin user"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": i18n.get_bilingual_response("unauthorized")}
        )
    
    try:
        token = authorization.split(" ")[1]
        username = verify_token(token)
        user = db.query(User).filter(User.username == username).first()
        
        if not user or not user.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": {"en": "Admin access required", "tr": "Admin yetkisi gerekli"}}
            )
        
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": i18n.get_bilingual_response("unauthorized")}
        )

@router.get("/dashboard")
async def get_admin_dashboard(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard statistics
    """
    
    # Total statistics
    total_users = db.query(func.count(User.id)).filter(User.is_admin == False).scalar()
    total_urls = db.query(func.count(URL.id)).scalar()
    total_clicks = db.query(func.sum(URL.click_count)).scalar() or 0
    
    # Users with their stats
    users_stats = db.query(
        User.id,
        User.username,
        User.email,
        User.is_active,
        User.created_at,
        func.count(URL.id).label('url_count'),
        func.sum(URL.click_count).label('total_clicks')
    ).join(URL, User.id == URL.user_id, isouter=True)\
     .filter(User.is_admin == False)\
     .group_by(User.id)\
     .order_by(desc('total_clicks'))\
     .all()
    
    users_list = []
    for user in users_stats:
        users_list.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "url_count": user.url_count or 0,
            "total_clicks": user.total_clicks or 0
        })
    
    # Flagged URLs
    flagged_urls = db.query(URL, User.username)\
        .join(User, URL.user_id == User.id)\
        .filter(URL.is_flagged == True)\
        .all()
    
    flagged_list = []
    for url, username in flagged_urls:
        flagged_list.append({
            "id": url.id,
            "short_code": url.short_code,
            "original_url": url.original_url,
            "username": username,
            "click_count": url.click_count,
            "created_at": url.created_at.isoformat()
        })
    
    return {
        "success": True,
        "data": {
            "statistics": {
                "total_users": total_users,
                "total_urls": total_urls,
                "total_clicks": total_clicks
            },
            "users": users_list,
            "flagged_urls": flagged_list
        }
    }

@router.get("/users")
async def get_all_users(
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users with their URLs and statistics
    """
    
    users = db.query(User).filter(User.is_admin == False).all()
    
    users_data = []
    for user in users:
        user_urls = db.query(URL).filter(URL.user_id == user.id).all()
        total_clicks = sum(url.click_count for url in user_urls)
        
        users_data.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "url_count": len(user_urls),
            "total_clicks": total_clicks,
            "urls": [
                {
                    "id": url.id,
                    "short_code": url.short_code,
                    "original_url": url.original_url,
                    "click_count": url.click_count,
                    "is_flagged": url.is_flagged,
                    "created_at": url.created_at.isoformat()
                }
                for url in user_urls
            ]
        })
    
    return {
        "success": True,
        "data": users_data
    }

@router.post("/users/{user_id}/warn")
async def send_warning_to_user(
    user_id: int,
    warning: WarningMessage,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Send warning message to a user
    """
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"message": {"en": "User not found", "tr": "Kullanıcı bulunamadı"}}
        )
    
    # Create warning
    new_warning = UserWarning(
        user_id=user_id,
        message=warning.message,
        url_id=warning.url_id
    )
    
    db.add(new_warning)
    db.commit()
    
    return {
        "success": True,
        "message": {
            "en": "Warning sent successfully",
            "tr": "Uyarı başarıyla gönderildi"
        }
    }

@router.post("/urls/{url_id}/flag")
async def flag_url(
    url_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Flag a URL as inappropriate
    """
    
    url = db.query(URL).filter(URL.id == url_id).first()
    if not url:
        raise HTTPException(
            status_code=404,
            detail={"message": {"en": "URL not found", "tr": "URL bulunamadı"}}
        )
    
    url.is_flagged = True
    db.commit()
    
    return {
        "success": True,
        "message": {
            "en": "URL flagged successfully",
            "tr": "URL başarıyla işaretlendi"
        }
    }

@router.delete("/urls/{url_id}")
async def delete_url(
    url_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Delete a URL (admin only)
    """
    
    url = db.query(URL).filter(URL.id == url_id).first()
    if not url:
        raise HTTPException(
            status_code=404,
            detail={"message": {"en": "URL not found", "tr": "URL bulunamadı"}}
        )
    
    # Delete associated visits
    db.query(URLVisit).filter(URLVisit.url_id == url_id).delete()
    
    # Delete URL
    db.delete(url)
    db.commit()
    
    return {
        "success": True,
        "message": {
            "en": "URL deleted successfully",
            "tr": "URL başarıyla silindi"
        }
    }

@router.post("/change-password")
async def change_admin_password(
    password_data: PasswordChange,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Change admin password
    """
    
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail={"message": {"en": "Password must be at least 6 characters", "tr": "Şifre en az 6 karakter olmalı"}}
        )
    
    admin.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    return {
        "success": True,
        "message": {
            "en": "Password changed successfully",
            "tr": "Şifre başarıyla değiştirildi"
        }
    }

@router.post("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate a user
    """
    
    user = db.query(User).filter(User.id == user_id, User.is_admin == False).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail={"message": {"en": "User not found", "tr": "Kullanıcı bulunamadı"}}
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    status_text = "activated" if user.is_active else "deactivated"
    status_text_tr = "aktif edildi" if user.is_active else "devre dışı bırakıldı"
    
    return {
        "success": True,
        "message": {
            "en": f"User {status_text} successfully",
            "tr": f"Kullanıcı başarıyla {status_text_tr}"
        },
        "is_active": user.is_active
    }
