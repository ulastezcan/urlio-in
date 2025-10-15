from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
from ..database import get_db, User
from ..utils.helpers import hash_password, verify_password, detect_language
from ..utils.auth import create_access_token
from ..utils.i18n import i18n

router = APIRouter(prefix="/auth", tags=["authentication"])

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    preferred_language: str = "tr"

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    lang = detect_language(request, user_data.preferred_language)
    
    # Check if user exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": i18n.get_bilingual_response("user_exists")}
        )
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": i18n.get_bilingual_response("user_exists")}
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        preferred_language=user_data.preferred_language
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": i18n.get_bilingual_response("register_success"),
        "user_id": new_user.id
    }

@router.post("/login")
async def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": i18n.get_bilingual_response("login_failed")}
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "preferred_language": user.preferred_language,
            "is_admin": user.is_admin if hasattr(user, 'is_admin') else False
        }
    }