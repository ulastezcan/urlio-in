from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import redis
import json
from ..database import get_db, User, URL, URLVisit
from ..utils.helpers import generate_short_code, generate_qr_code, get_client_ip, get_country_from_ip, detect_language
from ..utils.auth import verify_token
from ..utils.i18n import i18n
import os

router = APIRouter(prefix="/user", tags=["user"])

# Redis client with authentication
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = redis.from_url(redis_url, decode_responses=True)

class URLShorten(BaseModel):
    original_url: str

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": i18n.get_bilingual_response("unauthorized")}
        )
    
    try:
        token = authorization.split(" ")[1]  # Remove 'Bearer ' prefix
        username = verify_token(token)
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": i18n.get_bilingual_response("unauthorized")}
            )
        return user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": i18n.get_bilingual_response("unauthorized")}
        )

@router.post("/shorten")
async def shorten_url(
    url_data: URLShorten, 
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lang = detect_language(request, current_user.preferred_language)
    
    # Validate URL (basic validation)
    if not url_data.original_url.startswith(('http://', 'https://')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": i18n.get_bilingual_response("invalid_url")}
        )
    
    # Generate unique short code
    short_code = generate_short_code()
    while db.query(URL).filter(URL.short_code == short_code).first():
        short_code = generate_short_code()
    
    # Generate QR code
    short_url = f"https://urlio.in/{short_code}"
    qr_code_path = generate_qr_code(short_url, short_code)
    
    # Create URL record
    new_url = URL(
        user_id=current_user.id,
        original_url=url_data.original_url,
        short_code=short_code,
        qr_code_path=qr_code_path
    )
    
    db.add(new_url)
    db.commit()
    db.refresh(new_url)
    
    # Cache in Redis
    redis_client.setex(f"url:{short_code}", 3600, url_data.original_url)
    
    return {
        "message": i18n.get_bilingual_response("link_created"),
        "short_code": short_code,
        "short_url": short_url,
        "qr_code_path": qr_code_path,
        "original_url": url_data.original_url
    }

@router.get("/stats/{short_code}")
async def get_stats(
    short_code: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    url_record = db.query(URL).filter(
        URL.short_code == short_code,
        URL.user_id == current_user.id
    ).first()
    
    if not url_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": i18n.get_bilingual_response("link_not_found")}
        )
    
    # Get visit statistics
    visits = db.query(URLVisit).filter(URLVisit.url_id == url_record.id).all()
    
    # Group visits by country
    country_stats = {}
    for visit in visits:
        country = visit.country or "Unknown"
        country_stats[country] = country_stats.get(country, 0) + 1
    
    return {
        "short_code": short_code,
        "original_url": url_record.original_url,
        "click_count": url_record.click_count,
        "created_at": url_record.created_at,
        "qr_code_path": url_record.qr_code_path,
        "country_stats": country_stats,
        "recent_visits": [
            {
                "country": visit.country,
                "created_at": visit.created_at,
                "ip_address": visit.ip_address[:8] + "***"  # Anonymize IP
            }
            for visit in visits[-10:]  # Last 10 visits
        ]
    }

@router.get("/urls")
async def get_user_urls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all URLs created by the current user"""
    urls = db.query(URL).filter(URL.user_id == current_user.id).order_by(URL.created_at.desc()).all()
    
    return [
        {
            "short_code": url.short_code,
            "original_url": url.original_url,
            "short_url": f"https://urlio.in/{url.short_code}",
            "click_count": url.click_count,
            "created_at": url.created_at,
            "qr_code_path": url.qr_code_path
        }
        for url in urls
    ]