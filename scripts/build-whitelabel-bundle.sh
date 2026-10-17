#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WHITELABEL_DIR="${ROOT_DIR}/whitelabel"
OUTPUT_DIR="${ROOT_DIR}/api/bundles"
BUNDLE_ZIP="${OUTPUT_DIR}/whitelabel.zip"
CHECKSUM_FILE="${OUTPUT_DIR}/whitelabel.zip.sha256"

echo "=========================================================="
echo " Packaging Standalone WhiteLabel Portal Distribution Bundle"
echo "=========================================================="
echo "Source Directory:      ${WHITELABEL_DIR}"
echo "Target Bundle Path:    ${BUNDLE_ZIP}"

if [ ! -d "${WHITELABEL_DIR}" ]; then
  echo "[-] Error: WhiteLabel source directory not found at ${WHITELABEL_DIR}"
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
rm -f "${BUNDLE_ZIP}" "${CHECKSUM_FILE}"

STAGE_DIR="$(mktemp -d /tmp/rmit-whitelabel-bundle-XXXXXX)"
trap 'rm -rf "${STAGE_DIR}"' EXIT

echo "[+] Syncing sanitized files to staging..."
rsync -av \
  --exclude="node_modules" \
  --exclude=".next" \
  --exclude=".git" \
  --exclude=".env*" \
  --include=".env.example" \
  --exclude="*.log" \
  --exclude="*.tsbuildinfo" \
  --exclude="coverage" \
  --exclude=".turbo" \
  --exclude="dist-package" \
  --exclude="whitelabel.zip" \
  --exclude="pnpm-workspace.yaml" \
  "${WHITELABEL_DIR}/" "${STAGE_DIR}/"

# Extract application version and git commit
APP_VERSION="$(node -p 'require("./whitelabel/package.json").version' 2>/dev/null || echo '1.0.0')"
COMMIT_HASH="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
BUILD_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Guarantee version metadata exists in distribution bundle
cat << EOF > "${STAGE_DIR}/version.json"
{
  "version": "${APP_VERSION}",
  "commitHash": "${COMMIT_HASH}",
  "buildTime": "${BUILD_TIME}"
}
EOF

# Guarantee .env.example exists in the distribution package
if [ -f "${WHITELABEL_DIR}/.env.example" ]; then
  cp -f "${WHITELABEL_DIR}/.env.example" "${STAGE_DIR}/.env.example"
fi

echo "[+] Compressing into isolated distribution archive..."
if command -v zip >/dev/null 2>&1; then
  (cd "${STAGE_DIR}" && zip -rq9 "${BUNDLE_ZIP}" .)
elif command -v python3 >/dev/null 2>&1; then
  echo "    (zip utility not found; using python3 zipfile fallback)"
  python3 -c "
import os, sys, zipfile

stage_dir = sys.argv[1]
bundle_zip = sys.argv[2]

with zipfile.ZipFile(bundle_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(stage_dir):
        for file in sorted(files):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, stage_dir)
            zf.write(full_path, rel_path)
" "${STAGE_DIR}" "${BUNDLE_ZIP}"
else
  echo "[-] Error: Neither 'zip' nor 'python3' is available to build distribution archive." >&2
  exit 1
fi

echo "[+] Computing SHA-256 integrity digest..."
sha256sum "${BUNDLE_ZIP}" | cut -d ' ' -f 1 > "${CHECKSUM_FILE}"

BUNDLE_SIZE="$(du -h "${BUNDLE_ZIP}" | cut -f1)"
BUNDLE_SIZE_BYTES="$(stat -c %s "${BUNDLE_ZIP}" 2>/dev/null || stat -f %z "${BUNDLE_ZIP}" 2>/dev/null || wc -c < "${BUNDLE_ZIP}")"
SHA256="$(cat "${CHECKSUM_FILE}")"

# Output version manifest to bundles directory
cat << EOF > "${OUTPUT_DIR}/version.json"
{
  "version": "${APP_VERSION}",
  "commitHash": "${COMMIT_HASH}",
  "buildTime": "${BUILD_TIME}",
  "sha256": "${SHA256}",
  "bundleSize": "${BUNDLE_SIZE}",
  "bundleSizeBytes": ${BUNDLE_SIZE_BYTES}
}
EOF

echo "=========================================================="
echo " [SUCCESS] WhiteLabel Distribution Bundle Ready"
echo " Version:  ${APP_VERSION} (${COMMIT_HASH:0:7})"
echo " Path:     ${BUNDLE_ZIP}"
echo " Size:     ${BUNDLE_SIZE} (${BUNDLE_SIZE_BYTES} bytes)"
echo " SHA-256:  ${SHA256}"
echo " Manifest: ${OUTPUT_DIR}/version.json"
echo "=========================================================="
