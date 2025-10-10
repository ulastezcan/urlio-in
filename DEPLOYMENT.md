# Deployment Guide

## Local Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml --env-file .env.dev up

# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Local Production Test

```bash
# Build and start local production
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Site: http://localhost
```

## Remote Server Deployment

### 1. Sync to Server
```bash
rsync -avz --exclude 'node_modules' --exclude '__pycache__' --exclude '.git' \
  ./ root@161.97.101.146:/opt/urlio-in/
```

### 2. Deploy on Server
```bash
ssh root@161.97.101.146
cd /opt/urlio-in

# Build services
docker-compose --env-file .env.prod build

# Start services
docker-compose --env-file .env.prod up -d

# Start nginx with SSL
docker run -d --name urlio-in-nginx-1 \
  --network urlio-in_routetr-network \
  -p 80:80 -p 443:443 \
  -v /opt/urlio-in/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:alpine
```

## Environment Files

- `.env.dev` - Local development
- `.env.production` - Local production
- `.env.prod` - Remote server production
- `frontend/.env.development` - Frontend dev API URL
- `frontend/.env.production` - Frontend prod API URL (urlio.in)
- `frontend/.env.production.local` - Frontend local prod API URL (localhost)

## Features Checklist

- ✅ URL Shortening
- ✅ QR Codes
- ✅ GeoIP Analytics
- ✅ HTTPS/SSL
- ✅ Google Analytics
- ✅ Multi-language (TR/EN)
- ✅ User Authentication
- ✅ Redis Caching
