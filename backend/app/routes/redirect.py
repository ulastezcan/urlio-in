from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import redis
from ..database import get_db, URL, URLVisit
from ..utils.helpers import get_client_ip, get_country_from_ip
from ..utils.i18n import i18n

router = APIRouter(tags=["redirect"])

# Redis client
redis_client = redis.Redis(host='redis', port=6379, db=0, decode_responses=True)

@router.get("/{short_code}")
async def redirect_url(short_code: str, request: Request, db: Session = Depends(get_db)):
    # Try to get URL from Redis cache first
    cached_url = redis_client.get(f"url:{short_code}")
    
    if cached_url:
        original_url = cached_url
        url_record = db.query(URL).filter(URL.short_code == short_code).first()
    else:
        # Get from database
        url_record = db.query(URL).filter(URL.short_code == short_code).first()
        if not url_record:
            raise HTTPException(
                status_code=404,
                detail={"message": i18n.get_bilingual_response("link_not_found")}
            )
        
        original_url = url_record.original_url
        # Cache for future requests
        redis_client.setex(f"url:{short_code}", 3600, original_url)
    
    if url_record:
        # Log the visit
        client_ip = get_client_ip(request)
        country = get_country_from_ip(client_ip)
        user_agent = request.headers.get("User-Agent", "")
        
        visit = URLVisit(
            url_id=url_record.id,
            ip_address=client_ip,
            country=country,
            user_agent=user_agent
        )
        
        db.add(visit)
        
        # Update click count
        url_record.click_count += 1
        db.commit()
    
    # Return redirect response
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=original_url, status_code=302)