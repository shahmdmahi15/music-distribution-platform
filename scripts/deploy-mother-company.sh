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

# 1. Ensure log directory exists & dependencies are installed
echo "📁 [Deploy] Verifying logs directory..."
mkdir -p "$APP_DIR/logs"

echo "⚡ [Deploy] Installing workspace dependencies across monorepo..."
pnpm install --frozen-lockfile

# 2. Deploy API Backend (Port 5000)
echo "🗄️ [Deploy: API] Generating Prisma Client..."
pnpm --filter api exec prisma generate

echo "🔄 [Deploy: API] Executing database migrations..."
pnpm --filter api exec prisma migrate deploy


echo "🏗️ [Deploy: API] Compiling NestJS production build..."
pnpm --filter api run build

echo "📦 [Deploy: Bundle] Building isolated whitelabel.zip distribution bundle..."
"$APP_DIR/scripts/build-whitelabel-bundle.sh"

# 3. Deploy Platform Console (Port 3000)
# Pre-build verification: ensure platform/.env exists and contains all required variables
echo "🔍 [Deploy: Platform] Verifying environment configuration in platform/.env..."
PLATFORM_ENV_FILE="$APP_DIR/platform/.env"
if [ ! -f "$PLATFORM_ENV_FILE" ]; then
    echo "❌ [DEPLOYMENT FAILURE] Environment file '$PLATFORM_ENV_FILE' does not exist!" >&2
    exit 1
fi

REQUIRED_PLATFORM_VARS=("NEXT_PUBLIC_APP_URL" "API_BASE_URL" "API_KEY" "INTERNAL_API_SECRET")
MISSING_VARS=()
for var in "${REQUIRED_PLATFORM_VARS[@]}"; do
    if ! grep -q "^${var}=" "$PLATFORM_ENV_FILE" || [ -z "$(grep "^${var}=" "$PLATFORM_ENV_FILE" | cut -d '=' -f2-)" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ [DEPLOYMENT FAILURE] platform/.env is missing required configuration keys: ${MISSING_VARS[*]}" >&2
    exit 1
fi
echo "✅ [Deploy: Platform] Environment configuration verified."

echo "🏗️ [Deploy: Platform] Compiling Next.js Platform build..."
pnpm --filter platform run build

# 4. Zero-Downtime PM2 Rolling Reload for Mother Company Services
cd "$APP_DIR"
if [ -x "$APP_DIR/node_modules/.bin/pm2" ]; then
    PM2_CMD="$APP_DIR/node_modules/.bin/pm2"
elif command -v pm2 > /dev/null 2>&1; then
    PM2_CMD="pm2"
else
    PM2_CMD="pnpm exec pm2"
fi

echo "🔄 [Deploy: PM2] Executing zero-downtime reload for rmit-api and rmit-platform using $PM2_CMD..."
if "$PM2_CMD" describe rmit-api > /dev/null 2>&1; then
    echo "♻️ Reloading existing PM2 processes with updated environment..."
    "$PM2_CMD" reload ecosystem.config.js --update-env
else
    echo "▶️ Launching PM2 processes from ecosystem.config.js..."
    "$PM2_CMD" start ecosystem.config.js --env production
fi

# 5. Persist PM2 Process List
echo "💾 [Deploy: PM2] Saving process list for system reboot..."
"$PM2_CMD" save

# 6. Health Verification with HTTP Status Code Validation
echo "🔍 [Deploy] Performing localhost health checks with strict status code validation..."

MAX_RETRIES=15
RETRY_INTERVAL=2

check_api_health() {
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health || curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/ || echo "000")
    echo "$code"
}

check_platform_health() {
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
    echo "$code"
}

API_HEALTH_CODE="000"
PLATFORM_HEALTH_CODE="000"

echo "⏳ Waiting for services to respond cleanly..."
for ((i=1; i<=MAX_RETRIES; i++)); do
    API_HEALTH_CODE=$(check_api_health)
    PLATFORM_HEALTH_CODE=$(check_platform_health)

    # API requires exact 200; Platform accepts 200, 307 (temporary redirect), or 308 (permanent redirect)
    if [ "$API_HEALTH_CODE" = "200" ] && [[ "$PLATFORM_HEALTH_CODE" =~ ^(200|307|308)$ ]]; then
        echo "✅ Services responded successfully on attempt $i/$MAX_RETRIES"
        break
    fi

    echo "Attempt $i/$MAX_RETRIES - API status: $API_HEALTH_CODE, Platform status: $PLATFORM_HEALTH_CODE. Retrying in ${RETRY_INTERVAL}s..."
    sleep "$RETRY_INTERVAL"
done

echo "📊 Final API Status Code (Port 5000):      $API_HEALTH_CODE"
echo "📊 Final Platform Status Code (Port 3000): $PLATFORM_HEALTH_CODE"

# Validate API status code strictly == 200
if [ "$API_HEALTH_CODE" != "200" ]; then
    echo "❌ [DEPLOYMENT FAILURE] API Health Check failed! Expected HTTP 200, got $API_HEALTH_CODE." >&2
    echo "Aborting deployment with non-zero exit code." >&2
    exit 1
fi

# Validate Platform status code in {200, 307, 308}
if ! [[ "$PLATFORM_HEALTH_CODE" =~ ^(200|307|308)$ ]]; then
    echo "❌ [DEPLOYMENT FAILURE] Platform Health Check failed! Expected HTTP 200, 307, or 308, got $PLATFORM_HEALTH_CODE." >&2
    echo "Aborting deployment with non-zero exit code." >&2
    exit 1
fi

echo "=============================================================================="
echo "✅ Mother Company Deployment Successfully Completed and Verified!"
echo "=============================================================================="
"$PM2_CMD" status
