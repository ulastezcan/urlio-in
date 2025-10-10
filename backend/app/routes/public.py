from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import redis
import os
from ..database import get_db, URL
from ..utils.helpers import generate_short_code, generate_qr_code, detect_language
from ..utils.i18n import i18n

router = APIRouter(prefix="/public", tags=["public"])

# Redis client
redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')  # Use docker service name
redis_client = redis.from_url(redis_url, decode_responses=True)

class URLShorten(BaseModel):
    original_url: str

@router.post("/shorten")
async def shorten_url_public(
    url_data: URLShorten, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Create short URL without authentication - for anonymous users"""
    
    # Validate URL (basic validation)
    if not url_data.original_url.startswith(('http://', 'https://')):
        raise HTTPException(
            status_code=400,
            detail={"message": i18n.get_bilingual_response("invalid_url")}
        )
    
    # Generate unique short code
    short_code = generate_short_code()
    while db.query(URL).filter(URL.short_code == short_code).first():
        short_code = generate_short_code()
    
    # Generate QR code
    short_url = f"https://urlio.in/{short_code}"
    qr_code_path = None  # Temporarily disable QR code generation
    
    # Create URL record without user_id (anonymous)
    new_url = URL(
        user_id=None,  # Anonymous user
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