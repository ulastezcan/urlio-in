#!/bin/bash

# urlio.in Quick Git Deployment Script
# Run this on your server: ssh root@161.97.101.146

set -e

echo "🚀 urlio.in Git Deployment for IP: 161.97.101.146"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${GREEN}✓${NC} $1"; }
print_info() { echo -e "${BLUE}ℹ${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    print_status "Docker installed"
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed"
fi

# Install required packages
print_info "Installing required packages..."
apt update && apt install -y git openssl bc curl
print_status "Packages installed"

# Clone or update project
if [ -d "/opt/urlio-in" ]; then
    print_info "Updating existing project..."
    cd /opt/urlio-in
    git pull origin main
else
    print_info "Cloning project from GitHub..."
    mkdir -p /opt
    cd /opt
    git clone https://github.com/ulastezcan/urlio-in.git
    cd urlio-in
fi

# Set permissions
chmod +x deploy.sh setup-ip-deployment.sh

print_status "Project ready"

# Setup environment
if [ ! -f ".env.prod.local" ]; then
    print_info "Creating environment file..."
    cp .env.prod .env.prod.local
    
    # Generate secure passwords
    DB_PASS=$(openssl rand -base64 32)
    REDIS_PASS=$(openssl rand -base64 32)
    SECRET=$(openssl rand -base64 64)
    
    # Update environment file
    cat > .env.prod.local << EOF
# Database Configuration
DB_USER=postgres
DB_PASSWORD=$DB_PASS
DATABASE_URL=postgresql://postgres:$DB_PASS@db:5432/urlioin

# Redis Configuration  
REDIS_PASSWORD=$REDIS_PASS
REDIS_URL=redis://:$REDIS_PASS@redis:6379/0

# JWT Secret Key
SECRET_KEY=$SECRET

# Domain Configuration
DOMAIN=161.97.101.146
API_URL=http://161.97.101.146/api
ALLOWED_HOSTS=161.97.101.146

# SSL Configuration (not used for IP)
SSL_EMAIL=kmulas.tezcan@gmail.com

# Environment
ENVIRONMENT=production
DEBUG=0
EOF
    
    print_status "Environment configured with secure passwords"
else
    print_info "Using existing environment file"
fi

# Setup IP deployment configuration
print_info "Setting up IP deployment configuration..."
./setup-ip-deployment.sh

# Stop existing containers
print_info "Stopping existing containers..."
docker-compose -f docker-compose.ip.yml down 2>/dev/null || true

# Build and start services
print_info "Building and starting services..."
docker-compose -f docker-compose.ip.yml --env-file .env.prod.local up -d --build

# Wait for services
print_info "Waiting for services to start..."
sleep 30

# Health checks
print_info "Performing health checks..."

if curl -f http://161.97.101.146/api/health >/dev/null 2>&1; then
    print_status "Backend is healthy"
else
    print_error "Backend health check failed"
    docker-compose -f docker-compose.ip.yml logs backend
    exit 1
fi

if curl -f http://161.97.101.146/ >/dev/null 2>&1; then
    print_status "Frontend is accessible"
else
    print_error "Frontend is not accessible" 
    docker-compose -f docker-compose.ip.yml logs frontend nginx
    exit 1
fi

# Show status
echo ""
echo "🎉 Deployment Successful!"
echo "========================"
echo "🌐 Frontend: http://161.97.101.146"
echo "📚 API Docs: http://161.97.101.146/api/docs"
echo "💓 Health: http://161.97.101.146/api/health"
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.ip.yml ps
echo ""
echo "🔍 To view logs: docker-compose -f docker-compose.ip.yml logs -f"
echo "🔄 To update: cd /opt/urlio-in && git pull && docker-compose -f docker-compose.ip.yml up -d --build"