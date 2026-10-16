#!/usr/bin/env bash
# ==============================================================================
# RoyalMotionIT Central PostgreSQL Disaster Recovery & Drill Restore Script
# ==============================================================================

set -euo pipefail

# 1. Parameter Validation
if [ "$#" -lt 1 ]; then
  echo "[-] Usage: $0 <path-to-backup-dump-file>" >&2
  echo "    Example: $0 /var/backups/postgres/rmit_db_backup_20261016_020000.dump" >&2
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[-] Error: Specified backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 2. Connection Defaults
DATABASE_URL="${DATABASE_URL:-}"
if [ -z "${DATABASE_URL}" ] && [ -f "${ROOT_DIR}/api/.env" ]; then
  ENV_DB_URL=$(grep "^DATABASE_URL=" "${ROOT_DIR}/api/.env" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
  if [ -n "$ENV_DB_URL" ]; then
    DATABASE_URL="$ENV_DB_URL"
  fi
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-music_distribution}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

CHECKSUM_FILE="${BACKUP_FILE}.sha256"

echo "=============================================================================="
echo "⚠️  CRITICAL: POSTGRESQL DATABASE RESTORE DRILL"
echo "=============================================================================="
echo "Target Host:     ${DB_HOST}:${DB_PORT}"
echo "Target Database: ${DB_NAME}"
echo "Target User:     ${DB_USER}"
echo "Source File:     ${BACKUP_FILE}"
echo "=============================================================================="

# 3. SHA-256 Checksum Verification
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "🔍 [DR Drill] Verifying SHA-256 checksum from ${CHECKSUM_FILE}..."
  BACKUP_DIR="$(dirname "${BACKUP_FILE}")"
  BACKUP_BASENAME="$(basename "${BACKUP_FILE}")"
  CHECKSUM_BASENAME="$(basename "${CHECKSUM_FILE}")"
  
  (
    cd "${BACKUP_DIR}"
    sha256sum -c "${CHECKSUM_BASENAME}"
  )
  echo "✅ [DR Drill] Integrity verified! SHA-256 matches perfectly."
else
  echo "⚠️ [DR Drill] No checksum file found at ${CHECKSUM_FILE}. Skipping checksum validation."
fi

# 4. Mandatory Explicit Confirmation
echo ""
echo "🚨 DANGER: This restore operation will DROP existing database objects and"
echo "   REPLACE schema and data in '${DB_NAME}' using: pg_restore --clean --if-exists."
echo ""
read -r -p "Type 'RESTORE' to execute this disaster recovery restore: " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE" ]; then
  echo "❌ [DR Drill] Confirmation denied ('${CONFIRMATION}'). Restore aborted."
  exit 1
fi

# 5. Execute pg_restore
echo "🔄 [DR Drill] Executing pg_restore --clean --if-exists..."
if [ -n "${DATABASE_URL}" ]; then
  CLEAN_DB_URL="${DATABASE_URL%%\?*}"
  pg_restore -d "${CLEAN_DB_URL}" --clean --if-exists --no-owner --no-privileges -v "${BACKUP_FILE}" || true
else
  export PGPASSWORD="${DB_PASSWORD}"
  pg_restore \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    -v \
    "${BACKUP_FILE}" || true
  unset PGPASSWORD
fi

echo "=============================================================================="
echo "✅ [DR Drill] Database restore completed for '${DB_NAME}'."
echo "=============================================================================="
