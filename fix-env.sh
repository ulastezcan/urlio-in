#!/bin/bash

# Fix broken .env.prod.local file
# Run this on server if you get "unexpected character" error

echo "🔧 Fixing .env.prod.local file..."

# Check if file exists and has problems
if [ -f "/opt/urlio-in/.env.prod.local" ]; then
    echo "Found existing .env.prod.local, backing up..."
    cp /opt/urlio-in/.env.prod.local /opt/urlio-in/.env.prod.local.backup
fi

cd /opt/urlio-in

# Generate new secure passwords (URL-safe, no special characters)
DB_PASS=$(openssl rand -hex 16)
REDIS_PASS=$(openssl rand -hex 16)
SECRET=$(openssl rand -hex 32)

echo "Generating new secure environment file..."

# Create new clean environment file
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

echo "✅ Environment file fixed!"
echo "🔒 Generated secure passwords:"
echo "   DB Password: $DB_PASS"
echo "   Redis Password: $REDIS_PASS"  
echo "   JWT Secret: $SECRET"
echo ""
echo "🚀 Now you can run:"
echo "   docker-compose -f docker-compose.ip.yml --env-file .env.prod.local up -d --build"