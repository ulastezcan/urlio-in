import os
import bcrypt
import secrets
import string
import qrcode
from PIL import Image
from io import BytesIO
import geoip2.database
from fastapi import Request

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_short_code(length: int = 6) -> str:
    """Generate a random short code."""
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

def generate_qr_code(url: str, short_code: str) -> str:
    """Generate QR code for URL and save it."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR code
    qr_dir = os.path.join(os.path.dirname(__file__), "..", "..", "static", "qr")
    os.makedirs(qr_dir, exist_ok=True)
    qr_path = os.path.join(qr_dir, f"{short_code}.png")
    img.save(qr_path)
    
    return f"/static/qr/{short_code}.png"

def get_country_from_ip(ip_address: str) -> str:
    """Get country from IP address using GeoIP2."""
    try:
        # Handle localhost and private IPs
        if ip_address in ['127.0.0.1', 'localhost', '::1'] or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
            return "Local"
        
        geoip_db = os.path.join(os.path.dirname(__file__), "..", "..", "geoip", "GeoLite2-Country.mmdb")
        with geoip2.database.Reader(geoip_db) as reader:
            response = reader.country(ip_address)
            return response.country.name if response.country.name else "Unknown"
    except Exception as e:
        print(f"GeoIP Error: {e}")
        return "Unknown"

def get_client_ip(request: Request) -> str:
    """Extract client IP from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def detect_language(request: Request, user_preference: str = None) -> str:
    """Detect language from user preference or Accept-Language header."""
    if user_preference:
        return user_preference
    
    accept_language = request.headers.get("Accept-Language", "")
    if "tr" in accept_language.lower():
        return "tr"
    elif "en" in accept_language.lower():
        return "en"
    return "en"
