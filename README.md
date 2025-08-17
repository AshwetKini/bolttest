# Shopee E-commerce Platform

A production-ready e-commerce monorepo built with NestJS, React, and Expo.

## 📁 Project Structure

```
shopee/
├── package.json                 # Root package.json with workspaces
├── README.md                   # This file
├── backend/                    # NestJS API server
├── admin/                      # React admin dashboard
├── mobile/                     # Expo mobile app
├── infra/                      # Infrastructure configs (PM2, systemd)
└── scripts/                    # Automation scripts
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ LTS
- npm 9+
- MongoDB running locally or MongoDB Atlas
- Git

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd shopee
npm install
```

### 2. Backend Setup

```bash
# Copy environment file
cp backend/.env.example backend/.env

# Edit backend/.env with your MongoDB connection
# MONGO_URI=mongodb://localhost:27017/shopee
# JWT_SECRET=your-super-secret-jwt-key
# JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Seed the database
npm run seed
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend API (http://localhost:3000)
npm run dev:backend

# Terminal 2: Admin Dashboard (http://localhost:5173)
npm run dev:admin

# Terminal 3: Mobile App
npm run dev:mobile
```

### 4. Mobile Development Notes

**For Android Emulator:**
- Use `http://10.0.2.2:3000` as API base URL in mobile/.env

**For Physical Device:**
- Use your machine's IP address: `http://192.168.1.XXX:3000`
- Ensure both devices are on the same network

**Expo SDK Version:**
- Pinned to SDK 50 for stability
- metro.config.js configured for pnpm workspaces

### 5. Test the System

```bash
# Run all tests
npm test

# Backend smoke test (full signup -> order flow)
npm run --workspace=backend test:smoke
```

## 🌐 API Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json
- **Postman Collection**: `backend/postman/shopee-api.json`

## 🔐 Authentication Flow

1. **Send OTP**: `POST /auth/send-otp` (phone number)
2. **Verify OTP**: `POST /auth/verify-otp` (phone + otp)
3. **Create MPIN**: `POST /auth/create-mpin` (4-6 digit PIN)
4. **Login**: `POST /auth/login-mpin` (phone + mpin)
5. **Refresh Token**: `POST /auth/refresh`
6. **Logout**: `POST /auth/logout`

## 📊 Key Features

### Backend (NestJS)
- JWT authentication with refresh tokens
- Role-based access control (superadmin, admin, store_owner)
- MongoDB with Mongoose ODM
- PDF invoice generation
- Rate limiting & security middleware
- Comprehensive logging with Winston
- Input validation with class-validator
- Swagger API documentation

### Admin Dashboard (React)
- Sales analytics with Recharts
- Store management
- User management
- Order tracking
- CSV export functionality
- Responsive design

### Mobile App (Expo)
- Biometric authentication
- Store browsing
- Order management
- Push notifications
- Offline capability

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests (uses mongodb-memory-server)
npm run --workspace=backend test:integration

# E2E tests
npm run --workspace=backend test:e2e

# Test coverage
npm run --workspace=backend test:coverage
```

## 📦 Production Deployment

### Backend Deployment (Ubuntu Server)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2 pnpm

# Create app user
sudo useradd -m -s /bin/bash shopee
sudo usermod -aG sudo shopee
```

#### 2. Application Deployment

```bash
# Clone repository
sudo su - shopee
git clone <repository-url> /home/shopee/shopee
cd /home/shopee/shopee

# Install dependencies and build
pnpm install --frozen-lockfile
pnpm run build:backend

# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# Start with PM2
pm2 start infra/pm2.config.js
pm2 save
pm2 startup
```

#### 3. Database Setup (MongoDB Atlas)

1. Create MongoDB Atlas cluster
2. Whitelist server IP address
3. Create database user
4. Update `MONGO_URI` in backend/.env
5. Configure automatic backups

#### 4. Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx

# Copy config
sudo cp infra/nginx.conf /etc/nginx/sites-available/shopee
sudo ln -s /etc/nginx/sites-available/shopee /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install snapd
sudo snap install --classic certbot

# Get certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal (crontab)
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 6. Systemd Service (Alternative to PM2)

```bash
# Copy service file
sudo cp infra/shopee.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable shopee
sudo systemctl start shopee
```

### Admin Dashboard Deployment

#### Option 1: Vercel

```bash
cd admin
npm run build
# Deploy to Vercel (connect GitHub repo)
```

#### Option 2: Nginx Static Hosting

```bash
cd admin
npm run build
sudo cp -r dist/* /var/www/html/admin/
```

### Mobile App Deployment

#### Development Build
```bash
cd mobile
expo build:android --type apk
expo build:ios --type archive
```

#### Production Build (EAS)
```bash
npm install -g @expo/cli eas-cli
eas build --platform all
```

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
BCRYPT_ROUNDS=12
API_RATE_LIMIT=100
CORS_ORIGIN=https://admin.yourdomain.com
```

### Admin (.env)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Shopee Admin
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
EXPO_PUBLIC_APP_NAME=Shopee
```

## 📈 Monitoring & Maintenance

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
pm2 restart all
```

### Database Backups
```bash
# MongoDB Atlas: Automated backups (configure retention)
# Self-hosted: Schedule mongodump
0 2 * * * mongodump --uri="mongodb://..." --out="/backup/$(date +\%Y\%m\%d)"
```

### Log Management
```bash
# Rotate logs
sudo logrotate /etc/logrotate.d/shopee

# Monitor logs
tail -f backend/logs/application.log
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check MongoDB connection
   - Verify environment variables
   - Check port availability

2. **Mobile app can't connect**
   - Verify API base URL
   - Check network connectivity
   - Ensure CORS is configured

3. **Admin dashboard blank**
   - Check API base URL
   - Verify build process
   - Check browser console

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/health

# Database connectivity
curl https://api.yourdomain.com/health/db
```

## 📞 Support

For issues and questions:
- Create GitHub issue
- Check logs in `backend/logs/`
- Use `npm run --workspace=backend test:smoke` for diagnostics

## 📄 License

MIT License - see LICENSE file for details.