-- AlterTable: Add Fleet Version & Auto-Update Telemetry columns to WhiteLabel
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "installedVersion" TEXT DEFAULT '1.0.0';
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "installedCommitHash" TEXT;
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "lastUpdateCheckedAt" TIMESTAMP(3);
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "lastUpdatedAt" TIMESTAMP(3);
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "updateStatus" TEXT DEFAULT 'UP_TO_DATE';
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "updateError" TEXT;
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "autoUpdateEnabled" BOOLEAN DEFAULT true;
