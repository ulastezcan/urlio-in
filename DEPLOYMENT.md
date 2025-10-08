# 🚀 urlio.in Quick Deployment Guide

Bu kılavuz urlio.in'i sunucunuza hızla deploy etmeniz için hazırlanmıştır.

## 📋 Ön Gereksinimler

- Ubuntu 20.04+ / CentOS 8+ / Debian 10+ sunucu
- Root veya sudo yetkisi
- Domain name (opsiyonel, localhost için gerekli değil)
- 2GB+ RAM, 1GB+ disk alanı

## ⚡ Hızlı Kurulum (5 Dakika)

### 1. Sunucu Hazırlığı

```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Oturumu yenileyin veya logout/login yapın
newgrp docker
```

### 2. Proje Kurulumu

```bash
# Projeyi klonlayın
git clone <your-repo-url>
cd urlio-in

# Environment dosyasını düzenleyin
cp .env.prod .env.prod.local
nano .env.prod.local
```

**Aşağıdaki satırları güncelleyin:**
```env
DOMAIN=yourdomain.com              # Domain'inizi yazın (localhost kullanabilirsiniz)
SSL_EMAIL=admin@yourdomain.com     # Email'inizi yazın
DB_PASSWORD=your_secure_password   # Güçlü bir şifre
REDIS_PASSWORD=your_secure_password # Güçlü bir şifre
SECRET_KEY=your_very_long_secret_key # En az 32 karakter
```

### 3. Otomatik Deployment

```bash
# Deployment script'ini çalıştırın
./deploy.sh

# Menüden "1) Full deployment" seçin
# Script otomatik olarak:
# - SSL sertifikalarını alacak
# - Güvenli şifreler oluşturacak
# - Servisleri başlatacak
# - Health check yapacak
```

### 4. Manuel Deployment (Alternatif)

```bash
# SSL sertifikaları (domain varsa)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Sertifikaları kopyalayın
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown $USER:$USER nginx/ssl/*.pem

# Production ortamını başlatın
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build
```

## ✅ Doğrulama

### Servis Durumunu Kontrol Edin

```bash
# Container'ları kontrol edin
docker-compose -f docker-compose.prod.yml ps

# Health check
curl https://yourdomain.com/api/health
curl https://yourdomain.com/health

# Logları görüntüleyin
docker-compose -f docker-compose.prod.yml logs -f
```

### Web Arayüzü

- **Frontend**: https://yourdomain.com
- **API Docs**: https://yourdomain.com/api/docs

## 🔧 Localhost Kurulumu (SSL olmadan)

Domain'iniz yoksa localhost ile test edebilirsiniz:

```bash
# .env.prod.local dosyasını düzenleyin
DOMAIN=localhost
API_URL=http://localhost:8000

# nginx.conf'u localhost için düzenleyin (80 portunu kullan)
# Veya development compose'u kullanın
docker-compose up -d

# Erişim
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

## 🚨 Sorun Giderme

### Port Çakışmaları
```bash
# Çakışan servisleri bulun
sudo lsof -i :80
sudo lsof -i :443

# Apache/Nginx durdurun
sudo systemctl stop apache2 nginx
```

### SSL Sorunları
```bash
# Certbot debug
sudo certbot certonly --standalone --dry-run -d yourdomain.com

# Manuel sertifika kontrol
openssl x509 -in nginx/ssl/fullchain.pem -text -noout
```

### Database Bağlantı Sorunları
```bash
# Container restart
docker-compose -f docker-compose.prod.yml restart db

# Database logs
docker-compose -f docker-compose.prod.yml logs db
```

## 🔄 Güncellemeler

```bash
# Kod güncellemesi
git pull

# Servisleri yeniden build edin
docker-compose -f docker-compose.prod.yml up -d --build

# Veya deployment script kullanın
./deploy.sh # "2) Quick deploy" seçin
```

## 📊 Monitoring

```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# System resources
docker stats

# Backup
./deploy.sh # "6) Backup database" seçin
```

## 🛡️ Güvenlik Önerileri

```bash
# Firewall
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Otomatik güncellemeler
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# SSL renewal (crontab)
0 0,12 * * * /usr/bin/certbot renew --quiet
```

## 📞 Destek

Sorun yaşıyorsanız:

1. **Logs kontrol edin**: `docker-compose logs -f`
2. **Health check yapın**: `./deploy.sh` menüsünden "4) Check health"
3. **GitHub Issues**: Repository'de issue açın
4. **Discord/Slack**: Topluluk desteği için

---

## 📦 Production Checklist

- [ ] Domain DNS'i sunucuya yönlendirildi
- [ ] SSL sertifikaları alındı
- [ ] Environment variables güncellendi
- [ ] Firewall ayarlandı
- [ ] Backup stratejisi belirlendi
- [ ] Monitoring kuruldu
- [ ] Health checks çalışıyor

**Tebrikler! 🎉 urlio.in başarıyla deploy edildi.**

Frontend: https://yourdomain.com
Backend API: https://yourdomain.com/api