#!/bin/bash
set -euo pipefail

echo "🔐 [SSL Setup] Generating SSL certificate for Cloudflare Full Mode..."
mkdir -p /etc/ssl/certs /etc/ssl/private

if [ ! -f /etc/ssl/certs/nginx-selfsigned.crt ]; then
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/ssl/private/nginx-selfsigned.key \
      -out /etc/ssl/certs/nginx-selfsigned.crt \
      -subj "/C=US/ST=Cloudflare/L=Edge/O=RoyalMotionIT/CN=*.royalmotionit.com"
    chmod 600 /etc/ssl/private/nginx-selfsigned.key
    echo "✅ Generated 10-year SSL certificate for *.royalmotionit.com"
else
    echo "ℹ️ SSL certificate already exists."
fi

echo "🔄 Updating Nginx configuration..."
cat << 'NGINX_CONF' > /etc/nginx/sites-available/music-distribution-platform
# ==============================================================================
# RoyalMotionIT Mother Company Nginx Production Configuration (HTTP & HTTPS)
# ==============================================================================

limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=platform_limit:10m rate=60r/s;

# 1. API Backend (api.royalmotionit.com & api.platform.royalmotionit.com)
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.royalmotionit.com api.platform.royalmotionit.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 500M;
    client_body_buffer_size 128k;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css application/xml;
    gzip_min_length 1024;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-IPCountry $http_cf_ipcountry;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
    }

    location ~ ^/(health|operational) {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}

# 2. Platform Console (platform.royalmotionit.com)
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name platform.royalmotionit.com;

    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript application/x-javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        limit_req zone=platform_limit burst=100 nodelay;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $http_cf_connecting_ip;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX_CONF

echo "🔍 Testing Nginx syntax..."
nginx -t

echo "🚀 Reloading Nginx service..."
systemctl reload nginx

echo "🎉 Nginx is now listening on BOTH Port 80 (HTTP) and Port 443 (HTTPS)!"
echo "Cloudflare SSL/TLS can now be set to either 'Flexible' or 'Full' without 521 errors!"
