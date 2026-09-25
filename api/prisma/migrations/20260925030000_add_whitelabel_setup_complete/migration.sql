-- AlterTable
ALTER TABLE "WhiteLabel" ADD COLUMN IF NOT EXISTS "isSetupComplete" BOOLEAN NOT NULL DEFAULT false;

-- Auto-migrate existing active tenants with names to setup complete
UPDATE "WhiteLabel"
SET "isSetupComplete" = true
WHERE "status" = 'ACTIVE'
  AND "name" IS NOT NULL
  AND TRIM("name") != '';
