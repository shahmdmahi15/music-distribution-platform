/*
  Warnings:

  - You are about to drop the column `workspaceUserId` on the `OAuthAccount` table. All the data in the column will be lost.
  - You are about to drop the column `workspaceUserId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `WorkspaceUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WhitelabelUserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'MEMBER', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "OAuthAccount" DROP CONSTRAINT "OAuthAccount_workspaceUserId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_workspaceUserId_fkey";

-- AlterTable
ALTER TABLE "OAuthAccount" DROP COLUMN "workspaceUserId",
ADD COLUMN     "whitelabelUserId" TEXT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "workspaceUserId",
ADD COLUMN     "whitelabelUserId" TEXT;

-- DropTable
DROP TABLE "WorkspaceUser";

-- DropEnum
DROP TYPE "WorkspaceUserRole";

-- CreateTable
CREATE TABLE "WhitelabelUser" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedPasswordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedTwoFactorAttempts" INTEGER NOT NULL DEFAULT 0,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" "WhitelabelUserRole" NOT NULL DEFAULT 'CUSTOMER',
    "lastLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhitelabelUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhitelabelUser_email_key" ON "WhitelabelUser"("email");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_whitelabelUserId_fkey" FOREIGN KEY ("whitelabelUserId") REFERENCES "WhitelabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_whitelabelUserId_fkey" FOREIGN KEY ("whitelabelUserId") REFERENCES "WhitelabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
