# 🚀 Git ile Production Deployment

Bu rehber urlio.in projesini GitHub'dan sunucunuza deploy etme sürecini anlatır.

## 📋 Ön Hazırlık

### 1. Sunucu Gereksinimleri
- Ubuntu 20.04+ / CentOS 8+ / Debian 10+
- Root veya sudo yetkisi
- 2GB+ RAM, 10GB+ disk alanı
- Internet bağlantısı

### 2. Domain/IP Konfigürasyonu
- **Domain kullanıyorsanız**: DNS A kaydını sunucu IP'sine yönlendirin
- **IP kullanıyorsanız**: Direk IP adresi ile çalışabilir

## 🔧 Sunucuda Kurulum

### 1. SSH Bağlantısı
```bash
ssh root@YOUR_SERVER_IP
# Örnek: ssh root@161.97.101.146
```

### 2. Sistem Güncellemesi ve Docker Kurulumu
```bash
# Sistem güncellemesi
apt update && apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose kurulumu
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Gerekli paketler
apt install -y git certbot openssl bc curl
```

### 3. Projeyi Git'ten Klonlayın
```bash
# Proje klasörü oluştur
mkdir -p /opt
cd /opt

# Repository'yi klonlayın
git clone https://github.com/ulastezcan/urlio-in.git
cd urlio-in

# Script izinlerini ayarla
chmod +x deploy.sh setup-ip-deployment.sh
```

### 4. Environment Konfigürasyonu
```bash
# .env.prod dosyasını kopyala ve düzenle
cp .env.prod .env.prod.local
nano .env.prod.local
```

**Aşağıdaki değerleri güncelleyin:**

#### Domain ile Deployment:
```env
DOMAIN=yourdomain.com
SSL_EMAIL=kmulas.tezcan@gmail.com
API_URL=https://yourdomain.com/api
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
```

#### IP ile Deployment:
```env
DOMAIN=161.97.101.146
SSL_EMAIL=kmulas.tezcan@gmail.com
API_URL=http://161.97.101.146/api
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
SECRET_KEY=$(openssl rand -hex 32)
```

## 🌟 Deployment Seçenekleri

### Seçenek 1: Domain ile SSL (Önerilen)

```bash
# Otomatik deployment
./deploy.sh

# Menüden "1) Full deployment" seçin
# Script otomatik olarak:
# - SSL sertifikaları alacak
# - Servisleri başlatacak
# - Health check yapacak
```

### Seçenek 2: IP Adresi ile (SSL olmadan)

```bash
# IP için özel konfigürasyon
./setup-ip-deployment.sh

# IP deployment başlat
docker-compose -f docker-compose.ip.yml --env-file .env.prod.local up -d --build
```

### Seçenek 3: Manuel Production Deployment

```bash
# SSL sertifikası al (domain varsa)
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Sertifikaları kopyala
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Production deployment
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
```

## ✅ Deployment Doğrulama

### Health Check
```bash
# Backend API kontrolü
curl http://YOUR_DOMAIN_OR_IP/api/health

# Frontend kontrolü  
curl http://YOUR_DOMAIN_OR_IP/

# Container durumu
docker-compose ps

# Logları görüntüle
docker-compose logs -f
```

### Web Arayüzü Test
- **Frontend**: `http://YOUR_DOMAIN_OR_IP`
- **API Docs**: `http://YOUR_DOMAIN_OR_IP/api/docs` 
- **Redirection Test**: Kısa bir URL oluşturup test edin

## 🔄 Güncellemeler

### Code Güncellemeleri
```bash
cd /opt/urlio-in

# En son kodu çek
git pull origin main

# Servisleri yeniden build et
docker-compose down
docker-compose up -d --build

# Health check
curl http://YOUR_DOMAIN_OR_IP/api/health
```

### Otomatik Güncelleme Script'i
```bash
# update.sh oluştur
cat > update.sh << 'EOF'
#!/bin/bash
cd /opt/urlio-in
echo "Pulling latest code..."
git pull origin main
echo "Rebuilding containers..."
docker-compose down
docker-compose up -d --build
echo "Health check..."
sleep 10
curl -f http://localhost/api/health && echo "✅ Update successful!" || echo "❌ Update failed!"
EOF

chmod +x update.sh
```

## 📊 Monitoring ve Maintenance

### Logları İzleme
```bash
# Real-time logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Database Backup
```bash
# Manuel backup
./deploy.sh # "6) Backup database" seçin

# Otomatik backup (crontab)
crontab -e
# Ekleyin: 0 2 * * * cd /opt/urlio-in && ./deploy.sh backup
```

### SSL Sertifika Yenileme
```bash
# Otomatik yenileme (crontab)
crontab -e
# Ekleyin: 0 0,12 * * * /usr/bin/certbot renew --quiet
```

## 🛡️ Güvenlik

### Firewall Ayarları
```bash
# UFW ile basit firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Güvenlik Güncellemeleri
```bash
# Otomatik güvenlik güncellemeleri
apt install unattended-upgrades
dpkg-reconfigure unattended-upgrades
```

## 🚨 Sorun Giderme

### Sık Karşılaşılan Sorunlar

1. **Port 80/443 kullanımda**
   ```bash
   # Çakışan servisleri bul ve durdur
   sudo lsof -i :80 -i :443
   sudo systemctl stop apache2 nginx
   ```

2. **Git clone hataları**
   ```bash
   # SSH key veya HTTPS authentication
   git clone https://github.com/username/urlio-in.git
   # Veya SSH: git clone git@github.com:username/urlio-in.git
   ```

3. **Docker build hataları**
   ```bash
   # Cache temizle
   docker system prune -a
   docker-compose build --no-cache
   ```

4. **SSL sertifika sorunları**
   ```bash
   # Let's Encrypt rate limit kontrol
   certbot certonly --dry-run -d yourdomain.com
   ```

## 📞 Destek

- **GitHub Issues**: Repository'nizde issue açın
- **Email**: kmulas.tezcan@gmail.com
- **Documentation**: README.md ve DEPLOYMENT.md

---

## 🎯 Hızlı Referans Komutları

```bash
# Deployment
git clone https://github.com/ulastezcan/urlio-in.git
cd urlio-in
cp .env.prod .env.prod.local
nano .env.prod.local
./deploy.sh

# Update
cd /opt/urlio-in && git pull && docker-compose up -d --build

# Logs
docker-compose logs -f

# Health
curl http://YOUR_DOMAIN/api/health

# Backup  
./deploy.sh # Option 6
```

**Başarılı deployment! 🚀 urlio.in artık production'da çalışıyor.**