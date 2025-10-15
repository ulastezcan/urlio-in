# Admin Panel Deployment Guide

## 🚀 Admin Panel Features
- Dashboard with total users, links, and clicks statistics
- User management with link count and click tracking
- Warning system for inappropriate content
- User activation/deactivation
- Admin password change
- URL flagging system

## 📋 Admin Credentials
- **Username:** admin
- **Password:** Admin@2025!Urlio
- **Email:** admin@urlio.in

## 🔧 Deployment Steps

### Step 1: Update Backend Database Schema
```bash
# SSH to your production server
ssh user@your-server

# Navigate to backend directory
cd /path/to/backend

# Run database migration
psql -U your_db_user -d your_db_name -f migrations/add_admin_features.sql
```

### Step 2: Deploy Backend Changes
```bash
# Copy updated files to production
scp backend/app/database.py user@server:/path/to/backend/app/
scp backend/app/routes/admin.py user@server:/path/to/backend/app/routes/
scp backend/app/main.py user@server:/path/to/backend/app/

# Restart backend service
sudo systemctl restart urlio-backend
# or if using PM2:
pm2 restart urlio-backend
```

### Step 3: Deploy Frontend Changes
```bash
# Build frontend locally
cd frontend
npm run build

# Deploy to production
scp -r dist/* user@server:/var/www/urlio.in/

# Or build on server
ssh user@server
cd /path/to/frontend
npm run build
sudo cp -r dist/* /var/www/urlio.in/
```

### Step 4: Verify Deployment
```bash
# Check backend logs
tail -f /var/log/urlio-backend.log

# Test API endpoints
curl -X POST https://urlio.in/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@2025!Urlio"}'

# Should return JWT token
```

### Step 5: Access Admin Panel
1. Go to https://urlio.in/admin
2. Login with admin credentials
3. You should see the admin dashboard

## 📊 Admin Panel API Endpoints

### Authentication
```
POST /auth/login
Body: { "username": "admin", "password": "Admin@2025!Urlio" }
```

### Dashboard Statistics
```
GET /admin/dashboard
Headers: Authorization: Bearer <token>
```

### User Management
```
GET /admin/users
Headers: Authorization: Bearer <token>
```

### Send Warning
```
POST /admin/users/{user_id}/warn
Headers: Authorization: Bearer <token>
Body: { "message": "Warning message", "url_id": optional }
```

### Flag URL
```
POST /admin/urls/{url_id}/flag
Headers: Authorization: Bearer <token>
```

### Delete URL
```
DELETE /admin/urls/{url_id}
Headers: Authorization: Bearer <token>
```

### Change Admin Password
```
POST /admin/change-password
Headers: Authorization: Bearer <token>
Body: { "new_password": "new_password_here" }
```

### Toggle User Status
```
POST /admin/users/{user_id}/toggle-status
Headers: Authorization: Bearer <token>
```

## 🗃️ Database Schema Changes

### New Columns
- `users.is_admin` (BOOLEAN) - Admin flag
- `users.is_active` (BOOLEAN) - User active status
- `urls.is_flagged` (BOOLEAN) - Inappropriate content flag

### New Table: user_warnings
```sql
CREATE TABLE user_warnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    url_id INTEGER REFERENCES urls(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔒 Security Notes
1. Admin access is JWT-based with `is_admin` flag verification
2. All admin endpoints require authentication
3. Change the default admin password immediately after first login
4. Keep database backups before running migrations

## 🐛 Troubleshooting

### Admin user not created
```sql
-- Manually insert admin user
INSERT INTO users (username, email, password_hash, is_admin, is_active)
VALUES ('admin', 'admin@urlio.in', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p02sLqGNiNPKQkj7nFQ7H.6K', TRUE, TRUE);
```

### Cannot access /admin
- Check if frontend build includes AdminDashboard.jsx
- Verify JWT token in localStorage
- Check browser console for errors

### API returns 403
- Verify admin user has `is_admin=TRUE` in database
- Check JWT token validity
- Ensure Authorization header is correct

## 📱 Admin Panel Features

### Dashboard View
- Total users count
- Total links created
- Total clicks across all links
- User list with statistics

### User Management
- View all registered users
- See link count per user
- Track total clicks per user
- See active/inactive status

### Moderation Tools
- Send warning messages to users
- Flag inappropriate URLs
- Delete URLs
- Activate/Deactivate user accounts

### Admin Settings
- Change admin password
- Secure password requirements (min 6 chars)

## 📝 Post-Deployment Checklist
- [ ] Database migration completed successfully
- [ ] Backend files updated and service restarted
- [ ] Frontend built and deployed
- [ ] Admin login works with provided credentials
- [ ] Dashboard displays statistics correctly
- [ ] Warning system functional
- [ ] User status toggle works
- [ ] Password change works
- [ ] All API endpoints respond correctly

## 🎉 Success!
Your admin panel is now deployed and ready to use at https://urlio.in/admin
