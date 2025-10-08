# urlio.in - Smart Links. Global Reach.

![urlio.in](https://img.shields.io/badge/urlio.in-URL%20Shortener-blue)
![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20TR-green)

# 🌐 urlio.in - Smart Links. Global Reach.

urlio.in, gelişmiş URL kısaltma ve analiz platformudur. Çok dilli desteği ve kapsamlı analitik özellikleri ile global ölçekte hizmet verir.

## ✨ Özellikler

- 🔗 **URL Kısaltma**: Uzun URL'leri kısa ve hatırlanabilir bağlantılara dönüştürün
- 🌍 **Çok Dilli Destek**: Türkçe ve İngilizce arayüz desteği
- 📱 **QR Kod**: Otomatik QR kod üretimi ve indirme
- 📊 **Analitik**: GeoIP tabanlı ülke analizi ve detaylı istatistikler
- 🔐 **Güvenli Giriş**: JWT tabanlı kullanıcı kimlik doğrulama
- 🎨 **Modern Tasarım**: Responsive ve kullanıcı dostu arayüz
- 🐳 **Docker Desteği**: Kolay kurulum ve deployment

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Docker & Docker Compose
- 2GB+ RAM
- 1GB+ Disk Alanı

### Local Development

```bash
# Repository'yi klonlayın
git clone <your-repo-url>
cd urlio-in

# Development ortamını başlatın
docker-compose up -d

# Uygulamanıza erişin
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
```

## 🌟 Production Deployment

### 1. Otomatik Deployment (Önerilen)

```bash
# Deployment scriptini çalıştırın
./deploy.sh

# Menüden "1) Full deployment" seçeneğini seçin
```

### 2. Manuel Deployment

#### Adım 1: Environment Konfigürasyonu

```bash
# .env.prod dosyasını düzenleyin
cp .env.prod.example .env.prod
nano .env.prod
```

Aşağıdaki değerleri güncelleyin:
```env
# Domain ve SSL
DOMAIN=yourdomain.com
SSL_EMAIL=your-email@yourdomain.com

# Güvenlik (güçlü şifreler kullanın)
DB_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password
SECRET_KEY=your_jwt_secret_key_minimum_32_characters

# API URL
API_URL=https://yourdomain.com/api
```

#### Adım 2: SSL Sertifikaları

```bash
# Let's Encrypt sertifikalarını alın
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Sertifikaları nginx klasörüne kopyalayın
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

#### Adım 3: Deployment

```bash
# Production ortamını başlatın
docker-compose -f docker-compose.prod.yml up -d --build

# Servis durumunu kontrol edin
docker-compose -f docker-compose.prod.yml ps
```

## 🛠️ Teknik Detaylar

### Mimari

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Nginx     │────│  Frontend   │────│   Backend   │
│  (Reverse   │    │   (React)   │    │  (FastAPI)  │
│   Proxy)    │    └─────────────┘    └─────────────┘
└─────────────┘                              │
                                             │
┌─────────────┐    ┌─────────────┐           │
│ PostgreSQL  │────│   Redis     │───────────┘
│ (Database)  │    │  (Cache)    │
└─────────────┘    └─────────────┘
```

### Teknoloji Stack'i

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Redis (Cache & Sessions)
- JWT (Authentication)
- GeoIP2 (Location analytics)

**Frontend:**
- React 18
- Vite (Build tool)
- Tailwind CSS
- i18next (Internationalization)
- Axios (HTTP client)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Reverse proxy)
- Let's Encrypt (SSL/TLS)

## 📊 Monitoring ve Maintenance

### Log İzleme

```bash
# Tüm servislerin logları
docker-compose -f docker-compose.prod.yml logs -f

# Sadece backend logları
docker-compose -f docker-compose.prod.yml logs -f backend

# Nginx logları
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Database Backup

```bash
# Manuel backup
./deploy.sh # Menüden "6) Backup database" seçin

# Otomatik backup (crontab)
0 2 * * * /path/to/your/project/deploy.sh backup
```

### SSL Sertifika Yenileme

```bash
# Sertifikaları yenileyin (her 90 günde bir)
sudo certbot renew --quiet

# Nginx'i yeniden başlatın
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔧 Konfigürasyon

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `localhost` |
| `API_URL` | Backend API URL | `http://localhost:8000` |
| `DB_PASSWORD` | Database password | - |
| `REDIS_PASSWORD` | Redis password | - |
| `SECRET_KEY` | JWT secret key | - |
| `SSL_EMAIL` | Email for SSL certificates | - |

### Nginx Konfigürasyonu

Rate limiting ve güvenlik ayarları `nginx/nginx.conf` dosyasında yapılandırılabilir:

- API rate limit: 10 req/sec
- Auth rate limit: 5 req/min
- SSL/TLS modern configuration
- Security headers

## 🚨 Troubleshooting

### Sık Karşılaşılan Sorunlar

1. **Port 80/443 kullanımda**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :443
   # Çakışan servisleri durdurun
   ```

2. **SSL sertifika hataları**
   ```bash
   # Sertifika dosyalarını kontrol edin
   ls -la nginx/ssl/
   # Yeniden oluşturun
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Database bağlantı hataları**
   ```bash
   # Container durumlarını kontrol edin
   docker-compose -f docker-compose.prod.yml ps
   # Database loglarını inceleyin
   docker-compose -f docker-compose.prod.yml logs db
   ```

4. **Frontend erişilemiyor**
   ```bash
   # Nginx konfigürasyonunu test edin
   docker-compose -f docker-compose.prod.yml exec nginx nginx -t
   # Nginx'i yeniden başlatın
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

### Health Check

```bash
# Backend health check
curl https://yourdomain.com/api/health

# Frontend health check
curl https://yourdomain.com/health

# Deployment script ile kontrol
./deploy.sh # "4) Check application health" seçin
```

## 🛡️ Güvenlik

### Önerilen Güvenlik Ayarları

1. **Güçlü şifreler kullanın**
   ```bash
   # Güvenli şifre üretimi
   openssl rand -base64 32
   ```

2. **Firewall ayarları**
   ```bash
   # UFW ile temel firewall
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp  
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Düzenli güncellemeler**
   ```bash
   # Docker images güncellemesi
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📈 Performance Optimization

### Database Optimizasyonu

```sql
-- Index'ler (otomatik oluşturulur)
CREATE INDEX idx_urls_short_code ON urls(short_code);
CREATE INDEX idx_url_visits_url_id ON url_visits(url_id);
CREATE INDEX idx_url_visits_created_at ON url_visits(created_at);
```

### Redis Konfigürasyonu

Redis memory usage ve cache politikaları ayarlanabilir.

### Nginx Caching

Static asset'ler için aggressive caching aktif.

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 📞 Destek

- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 📧 **Email**: support@urlio.in

---

**urlio.in** - Smart Links. Global Reach. 🌍

## 🌟 Features

- **URL Shortening**: Create short, memorable links
- **QR Code Generation**: Automatic QR codes for all shortened URLs
- **Analytics**: Track clicks with GeoIP country detection
- **Bilingual Interface**: Full support for English and Turkish
- **User Authentication**: Secure JWT-based authentication
- **Real-time Caching**: Redis-powered fast redirects
- **Responsive Design**: Works on all devices

## 🏗️ Architecture

### Backend (FastAPI)
- RESTful API with automatic OpenAPI documentation
- PostgreSQL database with SQLAlchemy ORM
- Redis for caching and performance
- JWT authentication with bcrypt password hashing
- Bilingual response system
- GeoIP analytics

### Frontend (React + Vite)
- Modern React with Hooks
- Tailwind CSS for styling
- i18next for internationalization
- Chart.js for analytics visualization
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd route-tr
   ```

2. **Start the services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🌍 Language Support

The application supports two languages:

- **🇹🇷 Turkish (Default)**: Primary language
- **🇬🇧 English**: Secondary language

Language detection:
1. User's stored preference
2. Browser's Accept-Language header
3. Defaults to Turkish

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login

### URL Management
- `POST /user/shorten` - Shorten URL
- `GET /user/stats/{short_code}` - Get analytics
- `GET /{short_code}` - Redirect to original URL

## 🛠️ Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    preferred_language VARCHAR(5) DEFAULT 'tr',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### URLs Table
```sql
CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) UNIQUE,
    qr_code_path TEXT,
    click_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### URL Visits Table
```sql
CREATE TABLE url_visits (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES urls(id),
    ip_address VARCHAR(45),
    country VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Environment Variables

#### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `DEBUG`: Enable debug mode

### Docker Services

- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Backend**: FastAPI on port 8000
- **Frontend**: React/Vite on port 5173

## 📈 Analytics Features

- **Click Tracking**: Real-time click counting
- **Geographic Analytics**: Country-based visitor statistics
- **Visit History**: Recent visitor logs
- **QR Code Generation**: Automatic QR codes for sharing

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configured for security
- **Input Validation**: Comprehensive request validation

## 🌐 Deployment

The application is containerized and ready for deployment:

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Production Considerations

1. **Environment Variables**: Set secure values for production
2. **Database**: Use managed PostgreSQL service
3. **Redis**: Use managed Redis service
4. **SSL/HTTPS**: Configure reverse proxy with SSL
5. **Domain**: Configure custom domain for short links

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Roadmap

- [ ] Custom short codes
- [ ] Bulk URL import
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Email notifications
- [ ] Social media integration
- [ ] Link expiration
- [ ] Team collaboration features

## 🐛 Issues & Support

For issues and support, please create an issue in the repository.

---

🔹 5. Branding

Platform name: urlio.in

Tagline:

🇬🇧 "Smart Links. Global Reach."

🇹🇷 "Akıllı Bağlantılar. Küresel Erişim."

Domain hardcoded for short links: https://urlio.in/{short_code}.

Made with ❤️ using FastAPI, React, PostgreSQL, and Redis.