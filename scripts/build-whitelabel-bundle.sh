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
  "${WHITELABEL_DIR}/" "${STAGE_DIR}/"

# Guarantee .env.example exists in the distribution package
if [ -f "${WHITELABEL_DIR}/.env.example" ]; then
  cp -f "${WHITELABEL_DIR}/.env.example" "${STAGE_DIR}/.env.example"
fi

echo "[+] Compressing into isolated distribution archive..."
(cd "${STAGE_DIR}" && zip -rq9 "${BUNDLE_ZIP}" .)

echo "[+] Computing SHA-256 integrity digest..."
sha256sum "${BUNDLE_ZIP}" | cut -d ' ' -f 1 > "${CHECKSUM_FILE}"

BUNDLE_SIZE="$(du -h "${BUNDLE_ZIP}" | cut -f1)"
SHA256="$(cat "${CHECKSUM_FILE}")"

echo "=========================================================="
echo " [SUCCESS] WhiteLabel Distribution Bundle Ready"
echo " Path:     ${BUNDLE_ZIP}"
echo " Size:     ${BUNDLE_SIZE}"
echo " SHA-256:  ${SHA256}"
echo "=========================================================="
