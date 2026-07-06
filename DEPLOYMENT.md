# YegnaFinder Backend Deployment Guide

This guide provides step-by-step instructions for deploying the YegnaFinder NestJS backend to a production environment. 

## Prerequisites

Before starting the deployment, ensure you have the following installed and accessible on your production server:
1. **Node.js** (LTS version, typically 18.x or 20.x)
2. **PostgreSQL** (v14 or higher)
3. **Redis** (v7 or higher)
4. **PM2** (Process Manager for Node.js) or **Docker** (if using containerized deployment)
5. **Nginx** (as a Reverse Proxy)
6. A Domain Name (e.g., `api.yegnafinder.com`) with an SSL certificate.

---

## Step 1: Clone and Build the Application

On your production server, clone the `main` branch (which should contain your production-ready code).

```bash
git clone https://github.com/YegaFinder/yegnafinder-backend.git
cd yegnafinder-backend
git checkout main
```

Install the dependencies and build the TypeScript code into the `dist/` folder:

```bash
# Install production dependencies (and dev dependencies needed for build)
npm install

# Compile TypeScript to JavaScript
npm run build
```

---

## Step 2: Configure Environment Variables

Create your production environment file.

```bash
cp .env.example .env
```

Edit the `.env` file with your production database credentials, secure JWT secrets, and the exact frontend origin:

```env
NODE_ENV=production
PORT=8000

# Specify the precise URL of your frontend for CORS (e.g., Next.js frontend)
FRONTEND_ORIGIN=https://yegnafinder.com,https://www.yegnafinder.com

# PostgreSQL Production Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_secure_db_user
DB_PASSWORD=your_secure_db_password
DB_NAME=yegnafinder_prod

# Redis Production Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# JWT Secrets (Generate strong, long, random strings)
JWT_SECRET=super_secure_random_string_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=another_super_secure_random_string_here
JWT_REFRESH_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRY_SECONDS=300
OTP_LENGTH=6
```

---

## Step 3: Run the Application with PM2

To ensure the application stays alive after server restarts or crashes, use PM2.

```bash
# Install PM2 globally if you haven't already
npm install -g pm2

# Start the NestJS application from the compiled dist directory
pm2 start dist/main.js --name "yegnafinder-api"

# Save the PM2 process list to start automatically on server boot
pm2 save
pm2 startup
```

---

## Step 4: Configure Nginx as a Reverse Proxy

You should not expose Node.js directly on port 80 or 443. Instead, use Nginx to forward requests to the Node application on port `8000`.

Create an Nginx configuration file: `/etc/nginx/sites-available/yegnafinder-api`

```nginx
server {
    listen 80;
    server_name api.yegnafinder.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Pass IP addresses for Rate Limiting to work correctly
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/yegnafinder-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Step 5: Secure with SSL (Certbot/Let's Encrypt)

Secure your API with an SSL certificate.

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yegnafinder.com
```

Certbot will automatically update your Nginx configuration to enforce HTTPS.

---

## Step 6: Verify Deployment

Check the PM2 logs to ensure the application started without database or Redis connection errors:

```bash
pm2 logs yegnafinder-api
```

Test the API via curl or Postman:

```bash
curl https://api.yegnafinder.com/api/v1/auth/login
```
*(You should see an error response indicating missing parameters, which means the API is reachable and active).*

---

## Maintenance & Updates

When you need to deploy new changes from the `main` branch in the future:

```bash
cd /path/to/yegnafinder-backend
git pull origin main
npm install
npm run build
pm2 restart yegnafinder-api
```
