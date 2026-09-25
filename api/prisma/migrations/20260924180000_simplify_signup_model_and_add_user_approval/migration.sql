-- AlterEnum
ALTER TYPE "WhiteLabelSignupModel" ADD VALUE IF NOT EXISTS 'ADMIN_APPROVAL';
ALTER TYPE "WhiteLabelSignupModel" ADD VALUE IF NOT EXISTS 'OPEN_REGISTRATION';

-- Migrate existing data
UPDATE "WhiteLabel" SET "userSignupModel" = 'OPEN_REGISTRATION' WHERE "userSignupModel"::text = 'OPEN_PUBLIC';
UPDATE "WhiteLabel" SET "userSignupModel" = 'ADMIN_APPROVAL' WHERE "userSignupModel"::text IN ('MANUAL_APPROVAL', 'VETTED_APPLICATION');

-- AlterTable
ALTER TABLE "WhiteLabelUser" ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT true;
