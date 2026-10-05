#!/bin/bash
# ==============================================================================
# RoyalMotionIT Mother Company Zero-Downtime PM2 Deployment Script
# Target: Production Mother Company EC2 (Ubuntu 24.04 LTS ARM64 / x86_64)
# Services: NestJS API (:5000) & Next.js Platform Console (:3000)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 [Mother Company Deploy] Initiating deployment in: $APP_DIR"
cd "$APP_DIR"

# 1. Ensure log directory exists
echo "📁 [Deploy] Verifying logs directory..."
mkdir -p "$APP_DIR/logs"

# 2. Deploy API Backend (Port 5000)
echo "⚡ [Deploy: API] Installing dependencies..."
cd "$APP_DIR/api"
pnpm install --frozen-lockfile

echo "🗄️ [Deploy: API] Generating Prisma Client..."
pnpm exec prisma generate

echo "🔄 [Deploy: API] Executing database migrations..."
pnpm exec prisma migrate deploy

echo "🏗️ [Deploy: API] Compiling NestJS production build..."
pnpm run build

# 3. Deploy Platform Console (Port 3000)
echo "⚡ [Deploy: Platform] Installing dependencies..."
cd "$APP_DIR/platform"
pnpm install --frozen-lockfile

echo "🏗️ [Deploy: Platform] Compiling Next.js Platform build..."
pnpm run build

# 4. Zero-Downtime PM2 Rolling Reload for Mother Company Services
cd "$APP_DIR"
echo "🔄 [Deploy: PM2] Executing zero-downtime reload for rmit-api and rmit-platform..."
if pm2 describe rmit-api > /dev/null 2>&1; then
    echo "♻️ Reloading existing PM2 processes with updated environment..."
    pm2 reload ecosystem.config.js --update-env
else
    echo "▶️ Launching PM2 processes from ecosystem.config.js..."
    pm2 start ecosystem.config.js --env production
fi

# 5. Persist PM2 Process List
echo "💾 [Deploy: PM2] Saving process list for system reboot..."
pm2 save

# 6. Health Verification
echo "🔍 [Deploy] Performing localhost health check..."
sleep 3

API_HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/ || true)
PLATFORM_HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || true)

echo "📊 API Status Code (Port 5000):      $API_HEALTH_CODE"
echo "📊 Platform Status Code (Port 3000): $PLATFORM_HEALTH_CODE"

echo "=============================================================================="
echo "✅ Mother Company Deployment Successfully Completed!"
echo "=============================================================================="
pm2 status
