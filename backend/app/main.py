from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
import os
import time
import logging

from .database import engine, Base
from .routes import auth, user, redirect
from .utils.i18n import i18n

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def wait_for_db():
    """Wait for database to be ready"""
    max_retries = 30
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Try to connect to database
            Base.metadata.create_all(bind=engine)
            logger.info("Database connection successful!")
            break
        except Exception as e:
            retry_count += 1
            logger.info(f"Database not ready, retrying... ({retry_count}/{max_retries})")
            time.sleep(2)
    
    if retry_count == max_retries:
        logger.error("Could not connect to database after maximum retries")
        raise Exception("Database connection failed")

# Wait for database and create tables
wait_for_db()

app = FastAPI(
    title="urlio.in",
    description="Smart Links. Global Reach. | Akıllı Bağlantılar. Küresel Erişim.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(redirect.router)

# Import and include public router
from .routes import public
app.include_router(public.router)

@app.get("/")
async def root():
    return {
        "message": {
            "en": "Welcome to urlio.in - Smart Links. Global Reach.",
            "tr": "urlio.in'e hoş geldiniz - Akıllı Bağlantılar. Küresel Erişim."
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "urlio.in"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": i18n.get_bilingual_response("internal_error"),
            "detail": str(exc) if os.getenv("DEBUG") else None
        }
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)