/*
  Warnings:

  - The values [CUSTOMER] on the enum `PlatformUserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [MEMBER,CUSTOMER] on the enum `WhiteLabelUserRole` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[email,whiteLabelId]` on the table `WhiteLabelUser` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkspaceAccessRole" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');

-- AlterEnum
BEGIN;
CREATE TYPE "PlatformUserRole_new" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');
ALTER TABLE "public"."PlatformUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "PlatformUser" ALTER COLUMN "role" TYPE "PlatformUserRole_new" USING ("role"::text::"PlatformUserRole_new");
ALTER TYPE "PlatformUserRole" RENAME TO "PlatformUserRole_old";
ALTER TYPE "PlatformUserRole_new" RENAME TO "PlatformUserRole";
DROP TYPE "public"."PlatformUserRole_old";
ALTER TABLE "PlatformUser" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "WhiteLabelUserRole_new" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');
ALTER TABLE "public"."WhiteLabelUser" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "WhiteLabelUser" ALTER COLUMN "role" TYPE "WhiteLabelUserRole_new" USING ("role"::text::"WhiteLabelUserRole_new");
ALTER TYPE "WhiteLabelUserRole" RENAME TO "WhiteLabelUserRole_old";
ALTER TYPE "WhiteLabelUserRole_new" RENAME TO "WhiteLabelUserRole";
DROP TYPE "public"."WhiteLabelUserRole_old";
ALTER TABLE "WhiteLabelUser" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;

-- DropIndex
DROP INDEX "WhiteLabelUser_email_key";

-- AlterTable
ALTER TABLE "PlatformUser" ALTER COLUMN "role" SET DEFAULT 'CLIENT';

-- AlterTable
ALTER TABLE "WhiteLabelUser" ALTER COLUMN "role" SET DEFAULT 'CLIENT';

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspacePartner" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspacePartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAccess" (
    "id" TEXT NOT NULL,
    "role" "WorkspaceAccessRole" NOT NULL DEFAULT 'CLIENT',
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspacePartner_userId_key" ON "WorkspacePartner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelUser_email_whiteLabelId_key" ON "WhiteLabelUser"("email", "whiteLabelId");

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePartner" ADD CONSTRAINT "WorkspacePartner_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacePartner" ADD CONSTRAINT "WorkspacePartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAccess" ADD CONSTRAINT "WorkspaceAccess_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceAccess" ADD CONSTRAINT "WorkspaceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
