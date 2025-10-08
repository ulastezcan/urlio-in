#!/bin/bash

# urlio.in Production Deployment Script
# This script helps deploy the urlio.in application to a production server

set -e

echo "🚀 urlio.in Production Deployment Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. Consider using a non-root user for security."
    fi
}

# Check system requirements
check_requirements() {
    print_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        echo "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # Check if ports are available
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 80 is already in use. Make sure to stop other services."
    fi
    
    if lsof -Pi :443 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 443 is already in use. Make sure to stop other services."
    fi
    
    print_status "System requirements check completed"
}

# Setup SSL certificates (Let's Encrypt)
setup_ssl() {
    print_info "Setting up SSL certificates..."
    
    if [ ! -f ".env.prod" ]; then
        print_error ".env.prod file not found. Please create it first."
        exit 1
    fi
    
    # Source environment variables
    source .env.prod
    
    if [ -z "$DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
        print_error "DOMAIN and SSL_EMAIL must be set in .env.prod"
        exit 1
    fi
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    # Install Certbot if not exists
    if ! command -v certbot &> /dev/null; then
        print_info "Installing Certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot
        else
            print_warning "Please install certbot manually for SSL certificates"
            return
        fi
    fi
    
    # Get SSL certificate
    print_info "Obtaining SSL certificate for $DOMAIN..."
    sudo certbot certonly --standalone \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
    sudo chown $USER:$USER nginx/ssl/*.pem
    
    print_status "SSL certificates setup completed"
}

# Setup environment
setup_environment() {
    print_info "Setting up production environment..."
    
    if [ ! -f ".env.prod" ]; then
        print_warning "Creating .env.prod from template..."
        cp .env.prod .env.prod.backup 2>/dev/null || true
        
        # Generate secure passwords
        DB_PASSWORD=$(openssl rand -base64 32)
        REDIS_PASSWORD=$(openssl rand -base64 32)
        SECRET_KEY=$(openssl rand -base64 64)
        
        # Update .env.prod with generated passwords
        sed -i "s/your_strong_db_password_here/$DB_PASSWORD/g" .env.prod
        sed -i "s/your_strong_redis_password_here/$REDIS_PASSWORD/g" .env.prod
        sed -i "s/your_jwt_secret_key_here_minimum_32_characters_long/$SECRET_KEY/g" .env.prod
        
        print_warning "Please update .env.prod with your domain and email before continuing"
        print_warning "Generated secure passwords have been set automatically"
        read -p "Press Enter after updating .env.prod..."
    fi
    
    print_status "Environment setup completed"
}

# Build and deploy
deploy() {
    print_info "Building and deploying application..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Build custom images
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Stop existing containers
    docker-compose -f docker-compose.prod.yml down
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    print_info "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_health
    
    print_status "Deployment completed successfully!"
}

# Check application health
check_health() {
    print_info "Checking application health..."
    
    # Check if containers are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_status "Containers are running"
    else
        print_error "Some containers are not running"
        docker-compose -f docker-compose.prod.yml ps
        return 1
    fi
    
    # Check backend health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_status "Backend is healthy"
    else
        print_error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost/ >/dev/null 2>&1; then
        print_status "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
}

# Setup monitoring (basic)
setup_monitoring() {
    print_info "Setting up basic monitoring..."
    
    # Create log rotation
    sudo tee /etc/logrotate.d/urlio-in > /dev/null <<EOF
/var/log/urlio-in/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 root root
}
EOF
    
    # Create monitoring script
    cat > monitor.sh <<'EOF'
#!/bin/bash
# Basic monitoring script for urlio.in

LOG_FILE="/var/log/urlio-in/monitor.log"
mkdir -p $(dirname $LOG_FILE)

echo "$(date): Checking urlio.in services..." >> $LOG_FILE

# Check containers
CONTAINERS_DOWN=$(docker-compose -f docker-compose.prod.yml ps -q | wc -l)
if [ $CONTAINERS_DOWN -eq 0 ]; then
    echo "$(date): ERROR - No containers running" >> $LOG_FILE
    # Here you can add notification logic (email, Slack, etc.)
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
if [ $(echo "$MEMORY_USAGE > 85" | bc) -eq 1 ]; then
    echo "$(date): WARNING - Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
fi
EOF
    
    chmod +x monitor.sh
    
    # Add to crontab (check every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/monitor.sh") | crontab -
    
    print_status "Basic monitoring setup completed"
}

# Backup database
backup_database() {
    print_info "Creating database backup..."
    
    BACKUP_DIR="./backups"
    mkdir -p $BACKUP_DIR
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/urlioin_backup_$TIMESTAMP.sql"
    
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres urlioin > $BACKUP_FILE
    
    # Compress backup
    gzip $BACKUP_FILE
    
    print_status "Database backup created: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Full deployment (recommended for first time)"
    echo "2) Quick deploy (update existing deployment)"
    echo "3) Setup SSL certificates only"
    echo "4) Check application health"
    echo "5) View logs"
    echo "6) Backup database"
    echo "7) Setup monitoring"
    echo "0) Exit"
    echo ""
    read -p "Enter your choice [0-7]: " choice
}

# View logs
view_logs() {
    echo "Which logs would you like to view?"
    echo "1) All services"
    echo "2) Backend only"
    echo "3) Frontend only"
    echo "4) Database only"
    echo "5) Nginx only"
    read -p "Enter your choice [1-5]: " log_choice
    
    case $log_choice in
        1) docker-compose -f docker-compose.prod.yml logs -f ;;
        2) docker-compose -f docker-compose.prod.yml logs -f backend ;;
        3) docker-compose -f docker-compose.prod.yml logs -f frontend ;;
        4) docker-compose -f docker-compose.prod.yml logs -f db ;;
        5) docker-compose -f docker-compose.prod.yml logs -f nginx ;;
        *) print_error "Invalid choice" ;;
    esac
}

# Main execution
main() {
    check_root
    
    while true; do
        show_menu
        case $choice in
            1)
                check_requirements
                setup_environment
                setup_ssl
                deploy
                setup_monitoring
                print_status "Full deployment completed! Your application should be running at https://$DOMAIN"
                ;;
            2)
                deploy
                ;;
            3)
                setup_ssl
                ;;
            4)
                check_health
                ;;
            5)
                view_logs
                ;;
            6)
                backup_database
                ;;
            7)
                setup_monitoring
                ;;
            0)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main