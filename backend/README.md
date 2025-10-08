# urlio.in Backend API

Backend service for the urlio.in URL shortening platform.

## Features
- URL shortening with custom short codes
- QR code generation
- User authentication with JWT
- Analytics with GeoIP country detection
- Bilingual support (English/Turkish)
- Redis caching
- PostgreSQL database

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `DEBUG`: Enable debug mode