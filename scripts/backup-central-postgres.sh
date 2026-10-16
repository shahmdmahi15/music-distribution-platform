#!/usr/bin/env bash
# ==============================================================================
# RoyalMotionIT Central PostgreSQL Automated Backup Script
# ==============================================================================
#
# CRON CONFIGURATION INSTRUCTIONS:
# To schedule this backup script automatically (e.g. daily at 02:00 UTC), create
# the file /etc/cron.d/postgres-backup with the following content:
#
# ------------------------------------------------------------------------------
# # /etc/cron.d/postgres-backup
# SHELL=/bin/bash
# PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
# 0 2 * * * root /home/shahmdmahi/projects/royalmotionit/music-distribution-platform/scripts/backup-central-postgres.sh >> /var/log/postgres-backup.log 2>&1
# ------------------------------------------------------------------------------
# Ensure proper permissions:
#   sudo chown root:root /etc/cron.d/postgres-backup
#   sudo chmod 0644 /etc/cron.d/postgres-backup
# ==============================================================================

set -euo pipefail

# 1. Configuration & Defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-music_distribution}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILENAME="rmit_db_backup_${TIMESTAMP}.dump"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
CHECKSUM_FILENAME="${BACKUP_FILENAME}.sha256"
CHECKSUM_FILEPATH="${BACKUP_DIR}/${CHECKSUM_FILENAME}"

echo "=============================================================================="
echo "📦 [Postgres Backup] Starting backup: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
echo "=============================================================================="

# 2. Ensure Backup Directory Exists
mkdir -p "${BACKUP_DIR}"

# 3. Execute pg_dump with Custom Compressed Format (-Fc)
export PGPASSWORD="${DB_PASSWORD}"

echo "🔄 [Postgres Backup] Dumping database to ${BACKUP_FILEPATH}..."
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -Fc \
  -f "${BACKUP_FILEPATH}"

unset PGPASSWORD

# 4. Generate SHA-256 Checksum Alongside Dump
echo "🔐 [Postgres Backup] Generating SHA-256 checksum..."
(
  cd "${BACKUP_DIR}"
  sha256sum "${BACKUP_FILENAME}" > "${CHECKSUM_FILENAME}"
)

BACKUP_SIZE="$(du -h "${BACKUP_FILEPATH}" | cut -f1)"
CHECKSUM_VAL="$(awk '{print $1}' "${CHECKSUM_FILEPATH}")"
echo "✅ [Postgres Backup] Local backup created: ${BACKUP_FILENAME} (${BACKUP_SIZE})"
echo "   SHA-256: ${CHECKSUM_VAL}"

# 5. Prune Local Backups Older than Retention Window (7 days default)
echo "🧹 [Postgres Backup] Pruning local backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "rmit_db_backup_*.dump" -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -type f -name "rmit_db_backup_*.dump.sha256" -mtime "+${RETENTION_DAYS}" -delete
echo "✅ [Postgres Backup] Retention pruning complete."

# 6. S3 Offsite Encrypted Replication (if configured & AWS CLI available)
if [ -n "${BACKUP_S3_BUCKET}" ]; then
  if command -v aws >/dev/null 2>&1; then
    echo "☁️ [Postgres Backup] Uploading encrypted backup to s3://${BACKUP_S3_BUCKET}/backups/postgres/..."
    aws s3 cp "${BACKUP_FILEPATH}" "s3://${BACKUP_S3_BUCKET}/backups/postgres/${BACKUP_FILENAME}" \
      --sse AES256 \
      --storage-class STANDARD_IA
    aws s3 cp "${CHECKSUM_FILEPATH}" "s3://${BACKUP_S3_BUCKET}/backups/postgres/${CHECKSUM_FILENAME}" \
      --sse AES256
    echo "✅ [Postgres Backup] S3 encrypted offsite upload completed successfully."
  else
    echo "⚠️ [Postgres Backup] BACKUP_S3_BUCKET is set, but aws-cli is not installed or not in PATH. Skipping offsite sync."
  fi
else
  echo "ℹ️ [Postgres Backup] BACKUP_S3_BUCKET not configured. Offsite S3 upload skipped."
fi

echo "=============================================================================="
echo "🎉 [Postgres Backup] Backup job finished successfully."
echo "=============================================================================="
