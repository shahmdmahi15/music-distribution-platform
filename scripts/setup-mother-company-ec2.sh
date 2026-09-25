#!/bin/bash
# ==============================================================================
# RoyalMotionIT Mother Company Server Initializer
# Target OS: Ubuntu 24.04 LTS (Noble) - ARM64 (AWS EC2 t4g.medium / t4g.large)
# ==============================================================================
set -euo pipefail

echo "🚀 [Mother Company EC2] Starting server provisioning..."
export DEBIAN_FRONTEND=noninteractive

# 1. Update system packages
echo "📦 Updating base system..."
apt-get update && apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release ufw git nginx jq unzip htop

# 2. Configure UFW Firewall
echo "🛡️ Configuring firewall rules..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 3. Install Node.js 22 LTS & PM2
echo "⚡ Installing Node.js 22 LTS and PM2..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2 pnpm

# 4. Prepare Application Directory
echo "📁 Setting up /var/www/music-distribution-platform..."
mkdir -p /var/www/music-distribution-platform
chown -R ubuntu:ubuntu /var/www/music-distribution-platform

# 5. Configure PM2 Startup
echo "⚙️ Configuring PM2 to launch on system boot..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 6. Install Nginx Configuration
echo "🌐 Configuring Nginx reverse proxy..."
if [ -f /var/www/music-distribution-platform/scripts/nginx-mother-company.conf ]; then
    cp /var/www/music-distribution-platform/scripts/nginx-mother-company.conf /etc/nginx/sites-available/music-distribution-platform
    ln -sf /etc/nginx/sites-available/music-distribution-platform /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
fi

echo "=============================================================================="
echo "✅ Server Provisioning Complete!"
echo "Node.js Version: $(node -v)"
echo "NPM Version:     $(npm -v)"
echo "PM2 Version:     $(pm2 -v)"
echo "Nginx Status:    $(systemctl is-active nginx)"
echo "=============================================================================="
