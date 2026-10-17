#!/usr/bin/env bash
# ==============================================================================
# RoyalMotionIT WhiteLabel Self-Updating Daemon
# Zero-Downtime Blue-Green Atomic Deployment with Automated Rollback
# Runs on Customer Dedicated EC2 Instances
# ==============================================================================
set -euo pipefail

# Ensure single execution via flock
exec 200>/var/run/rmit-whitelabel-updater.lock
flock -n 200 || {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] WhiteLabel updater is already running in another process. Exiting."
  exit 0
}

FORCE_UPDATE=0
for arg in "$@"; do
  if [ "$arg" = "--force" ] || [ "$arg" = "-f" ]; then
    FORCE_UPDATE=1
  fi
done

BASE_DIR="/var/www/whitelabel"
SHARED_DIR="${BASE_DIR}/shared"
RELEASES_DIR="${BASE_DIR}/releases"
CURRENT_LINK="${BASE_DIR}/current"
LOG_FILE="${SHARED_DIR}/logs/updater.log"

export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
export COREPACK_ENABLE_STRICT=0
export COREPACK_ENABLE_AUTO_PIN=0

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  if [ -d "${SHARED_DIR}/logs" ]; then
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  fi
}

error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
  echo "$msg" >&2
  if [ -d "${SHARED_DIR}/logs" ]; then
    echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
  fi
}

# 1. Structure Initialization & Legacy Layout Migration
mkdir -p "$SHARED_DIR" "$RELEASES_DIR" "${SHARED_DIR}/logs"
chown -R ubuntu:ubuntu "$SHARED_DIR" "$RELEASES_DIR" 2>/dev/null || true

# Migrate legacy flat directory to releases/current architecture if needed
if [ ! -L "$CURRENT_LINK" ]; then
  log "Initializing atomic directory architecture..."

  # Move existing .env into shared if it exists as regular file
  if [ -f "${BASE_DIR}/.env" ] && [ ! -L "${BASE_DIR}/.env" ]; then
    cp -f "${BASE_DIR}/.env" "${SHARED_DIR}/.env"
  fi

  # Move ecosystem config into shared
  if [ -f "${BASE_DIR}/ecosystem.config.js" ] && [ ! -L "${BASE_DIR}/ecosystem.config.js" ]; then
    cp -f "${BASE_DIR}/ecosystem.config.js" "${SHARED_DIR}/ecosystem.config.js"
  fi

  # If existing build exists in BASE_DIR, move into initial release folder
  if [ -d "${BASE_DIR}/src" ] || [ -f "${BASE_DIR}/package.json" ]; then
    INITIAL_DIR="${RELEASES_DIR}/release-initial"
    if [ ! -d "$INITIAL_DIR" ]; then
      mkdir -p "$INITIAL_DIR"
      find "$BASE_DIR" -maxdepth 1 -mindepth 1 \
        ! -name "shared" \
        ! -name "releases" \
        ! -name "current" \
        -exec mv {} "$INITIAL_DIR/" \; 2>/dev/null || true
    fi
    ln -sfn "$INITIAL_DIR" "$CURRENT_LINK"
    chown -h ubuntu:ubuntu "$CURRENT_LINK" 2>/dev/null || true
  fi
fi

# Ensure shared ecosystem.config.js targets /var/www/whitelabel/current
cat << 'ECOSYSTEM_EOF' > "${SHARED_DIR}/ecosystem.config.js"
module.exports = {
  apps: [
    {
      name: "whitelabel-portal",
      cwd: "/var/www/whitelabel/current",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 1000,
      exp_backoff_restart_delay: 100,
      max_restarts: 15,
      error_file: "/var/www/whitelabel/shared/logs/whitelabel-portal-error.log",
      out_file: "/var/www/whitelabel/shared/logs/whitelabel-portal-out.log",
      merge_logs: true,
      time: true,
      node_args: "--max-old-space-size=1024",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
ECOSYSTEM_EOF
chown ubuntu:ubuntu "${SHARED_DIR}/ecosystem.config.js" 2>/dev/null || true

# 2. Read Configuration
ENV_FILE="${SHARED_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  if [ -f "${CURRENT_LINK}/.env" ]; then
    cp -f "${CURRENT_LINK}/.env" "$ENV_FILE"
  else
    error "Missing environment configuration in $ENV_FILE"
    exit 1
  fi
fi

API_BASE_URL="$(grep -E '^API_BASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '\"' | tr -d "'" | tr -d '\r')"
API_KEY="$(grep -E '^API_KEY=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '\"' | tr -d "'" | tr -d '\r')"

if [ -z "$API_BASE_URL" ] || [ -z "$API_KEY" ]; then
  error "API_BASE_URL or API_KEY not found in $ENV_FILE"
  exit 1
fi

send_telemetry() {
  local status="$1"
  local ver="$2"
  local commit="${3:-}"
  local err_msg="${4:-}"

  local payload
  payload=$(python3 -c "
import json, sys
data = {
  'installedVersion': sys.argv[1],
  'commitHash': sys.argv[2] if sys.argv[2] else None,
  'status': sys.argv[3],
  'error': sys.argv[4] if sys.argv[4] else None
}
print(json.dumps(data))
" "$ver" "$commit" "$status" "$err_msg" 2>/dev/null || true)

  if [ -n "$payload" ]; then
    curl -sS -X POST "${API_BASE_URL}/whitelabel/system/telemetry" \
      -H "x-api-key: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "$payload" >/dev/null 2>&1 || true
  fi
}

# 3. Check Local Version vs Remote Version Manifest
LOCAL_VERSION="0.0.0"
LOCAL_COMMIT=""
LOCAL_SHA=""

if [ -f "${CURRENT_LINK}/version.json" ]; then
  LOCAL_VERSION="$(python3 -c "import json; v=json.load(open('${CURRENT_LINK}/version.json')); print(v.get('version','0.0.0'))" 2>/dev/null || echo '0.0.0')"
  LOCAL_COMMIT="$(python3 -c "import json; v=json.load(open('${CURRENT_LINK}/version.json')); print(v.get('commitHash',''))" 2>/dev/null || echo '')"
  LOCAL_SHA="$(python3 -c "import json; v=json.load(open('${CURRENT_LINK}/version.json')); print(v.get('sha256',''))" 2>/dev/null || echo '')"
elif [ -f "${CURRENT_LINK}/package.json" ]; then
  LOCAL_VERSION="$(python3 -c "import json; v=json.load(open('${CURRENT_LINK}/package.json')); print(v.get('version','0.0.0'))" 2>/dev/null || echo '0.0.0')"
fi

log "Active installed version: ${LOCAL_VERSION} (${LOCAL_COMMIT:0:7})"

log "Querying Central API for latest WhiteLabel release..."
MANIFEST_JSON="$(curl -fSsL -H "x-api-key: ${API_KEY}" -H "Accept: application/json" "${API_BASE_URL}/whitelabel/system/version" 2>/dev/null || true)"

if [ -z "$MANIFEST_JSON" ]; then
  error "Failed to retrieve version manifest from Central API (${API_BASE_URL}/whitelabel/system/version)."
  exit 1
fi

REMOTE_VERSION="$(python3 -c "import json,sys; m=json.loads(sys.argv[1]); print(m.get('latestRelease',{}).get('version',''))" "$MANIFEST_JSON" 2>/dev/null || echo '')"
REMOTE_SHA="$(python3 -c "import json,sys; m=json.loads(sys.argv[1]); print(m.get('latestRelease',{}).get('sha256',''))" "$MANIFEST_JSON" 2>/dev/null || echo '')"
REMOTE_COMMIT="$(python3 -c "import json,sys; m=json.loads(sys.argv[1]); print(m.get('latestRelease',{}).get('commitHash',''))" "$MANIFEST_JSON" 2>/dev/null || echo '')"

if [ -z "$REMOTE_VERSION" ] || [ -z "$REMOTE_SHA" ]; then
  error "Invalid version manifest returned by Central API: $MANIFEST_JSON"
  exit 1
fi

log "Latest release on Central API: ${REMOTE_VERSION} (${REMOTE_COMMIT:0:7}) [SHA256: ${REMOTE_SHA:0:12}...]"

# Compare versions
if [ "$FORCE_UPDATE" -eq 0 ] && [ "$LOCAL_VERSION" = "$REMOTE_VERSION" ] && [ -n "$LOCAL_COMMIT" ] && [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
  log "WhiteLabel is already up to date (version ${LOCAL_VERSION}). No update needed."
  send_telemetry "UP_TO_DATE" "$LOCAL_VERSION" "$LOCAL_COMMIT" ""
  exit 0
fi

log "Update detected! Proceeding with zero-downtime deployment: ${LOCAL_VERSION} -> ${REMOTE_VERSION}"
send_telemetry "UPDATING" "$LOCAL_VERSION" "$LOCAL_COMMIT" ""

# 4. Download and Verify Package in Isolated Staging Directory
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/v${REMOTE_VERSION}_${TIMESTAMP}"
TMP_BUNDLE="/tmp/whitelabel-update-${TIMESTAMP}.zip"

mkdir -p "$RELEASE_DIR"
chown -R ubuntu:ubuntu "$RELEASE_DIR"

log "Downloading distribution bundle from Central API..."
if ! curl -fSsL -H "x-api-key: ${API_KEY}" "${API_BASE_URL}/whitelabel/system/bundle" -o "$TMP_BUNDLE"; then
  error "Failed to download distribution bundle from Central API."
  rm -rf "$TMP_BUNDLE" "$RELEASE_DIR"
  send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "Download failed"
  exit 1
fi

log "Verifying SHA-256 cryptographic digest..."
DOWNLOAD_SHA="$(sha256sum "$TMP_BUNDLE" | cut -d ' ' -f 1)"

if [ "$DOWNLOAD_SHA" != "$REMOTE_SHA" ]; then
  error "Integrity check failed! Expected SHA-256: ${REMOTE_SHA}, received: ${DOWNLOAD_SHA}"
  rm -rf "$TMP_BUNDLE" "$RELEASE_DIR"
  send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "Checksum mismatch: expected $REMOTE_SHA got $DOWNLOAD_SHA"
  exit 1
fi
log "Checksum verified: ${DOWNLOAD_SHA}"

# 5. Extract Bundle into Isolated Release Directory
log "Extracting distribution bundle into staging directory..."
if command -v unzip >/dev/null 2>&1; then
  unzip -q -o "$TMP_BUNDLE" -d "$RELEASE_DIR"
elif command -v python3 >/dev/null 2>&1; then
  python3 -m zipfile -e "$TMP_BUNDLE" "$RELEASE_DIR"
fi
rm -f "$TMP_BUNDLE"

# Safety sanitize: never allow workspace file in standalone package
rm -f "${RELEASE_DIR}/pnpm-workspace.yaml" 2>/dev/null || true

# Symlink shared environment into release
ln -sf "${SHARED_DIR}/.env" "${RELEASE_DIR}/.env"
ln -sf "${SHARED_DIR}/.env" "${RELEASE_DIR}/.env.production"
ln -sf "${SHARED_DIR}/.env" "${RELEASE_DIR}/.env.local"

# Copy verified version manifest into release
cat << EOF > "${RELEASE_DIR}/version.json"
{
  "version": "${REMOTE_VERSION}",
  "commitHash": "${REMOTE_COMMIT}",
  "sha256": "${REMOTE_SHA}",
  "installedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

chown -R ubuntu:ubuntu "$RELEASE_DIR"

# 6. Install Dependencies & Build Offline in Staging
log "Installing dependencies in staging release (pnpm install)..."
cd "$RELEASE_DIR"

if ! sudo -u ubuntu env "PATH=$PATH" "COREPACK_ENABLE_STRICT=0" "COREPACK_ENABLE_AUTO_PIN=0" pnpm install --frozen-lockfile; then
  log "Fallback to standard pnpm install..."
  if ! sudo -u ubuntu env "PATH=$PATH" "COREPACK_ENABLE_STRICT=0" "COREPACK_ENABLE_AUTO_PIN=0" pnpm install; then
    error "Dependency installation failed in staging release."
    rm -rf "$RELEASE_DIR"
    send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "pnpm install failed"
    exit 1
  fi
fi

log "Compiling production build in staging release (pnpm run build)..."
if ! sudo -u ubuntu env "PATH=$PATH" "COREPACK_ENABLE_STRICT=0" "COREPACK_ENABLE_AUTO_PIN=0" pnpm run build; then
  error "Next.js build failed in staging release. Aborting update. Current version remains untouched."
  rm -rf "$RELEASE_DIR"
  send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "next build failed"
  exit 1
fi

# Pre-flight build artifact verification
if [ ! -d "${RELEASE_DIR}/.next" ]; then
  error "Build verification failed: missing .next directory."
  rm -rf "$RELEASE_DIR"
  send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "Missing .next build artifacts"
  exit 1
fi

log "Production build compiled successfully!"

# 7. Atomic Symlink Switch
log "Switching active symlink atomically to ${RELEASE_DIR}..."
ln -sfn "$RELEASE_DIR" "${BASE_DIR}/current_tmp"
mv -Tf "${BASE_DIR}/current_tmp" "$CURRENT_LINK"
chown -h ubuntu:ubuntu "$CURRENT_LINK"

# Link ecosystem.config.js to current directory for PM2
ln -sf "${SHARED_DIR}/ecosystem.config.js" "${CURRENT_LINK}/ecosystem.config.js"

# 8. Reload PM2 with Zero Downtime
log "Reloading PM2 application process..."
cd "$CURRENT_LINK"
sudo -u ubuntu env "PATH=$PATH" pm2 reload "${SHARED_DIR}/ecosystem.config.js" --update-env || \
  sudo -u ubuntu env "PATH=$PATH" pm2 start "${SHARED_DIR}/ecosystem.config.js"
sudo -u ubuntu env "PATH=$PATH" pm2 save 2>/dev/null || true

# 9. Verify Service Health on Port 3000
log "Verifying health check on Port 3000..."
HEALTHY=0
for i in {1..20}; do
  HTTP_CODE="$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 || echo "000")"
  if [[ "$HTTP_CODE" =~ ^(200|307|308|404)$ ]]; then
    HEALTHY=1
    break
  fi
  sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
  error "Health check failed on Port 3000 (HTTP $HTTP_CODE). Reverting to previous release if available..."
  # Rollback to previous release if available
  PREV_RELEASE="$(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d ! -name "$(basename "$RELEASE_DIR")" | sort -r | head -n 1 || true)"
  if [ -n "$PREV_RELEASE" ] && [ -d "$PREV_RELEASE" ]; then
    log "Rolling back to previous release: $PREV_RELEASE"
    ln -sfn "$PREV_RELEASE" "${BASE_DIR}/current_tmp"
    mv -Tf "${BASE_DIR}/current_tmp" "$CURRENT_LINK"
    sudo -u ubuntu env "PATH=$PATH" pm2 reload "${SHARED_DIR}/ecosystem.config.js" || true
  fi
  send_telemetry "UPDATE_FAILED" "$LOCAL_VERSION" "$LOCAL_COMMIT" "Health check failed after reload"
  exit 1
fi

# 10. Prune Old Releases (Keep Last 2 for Instant Rollback)
log "Pruning old releases (retaining last 2 releases)..."
find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +3 | while read -r old_rel; do
  log "Removing pruned release: $old_rel"
  rm -rf "$old_rel"
done

# 11. Report Success Telemetry to Central Platform
log "Reporting successful update to Central Platform..."
send_telemetry "UPDATE_SUCCESS" "$REMOTE_VERSION" "$REMOTE_COMMIT" ""

log "=========================================================="
log " [SUCCESS] WhiteLabel Portal updated to v${REMOTE_VERSION}!"
log " Active Path: ${CURRENT_LINK} -> ${RELEASE_DIR}"
log "=========================================================="
exit 0
