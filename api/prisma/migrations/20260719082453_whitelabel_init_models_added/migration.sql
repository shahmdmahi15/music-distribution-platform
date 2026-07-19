/*
  Warnings:

  - You are about to drop the column `whitelabelUserId` on the `OAuthAccount` table. All the data in the column will be lost.
  - You are about to drop the column `whitelabelUserId` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the `WhitelabelUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WhiteLabelUserRole" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'MANAGER', 'STAFF', 'MEMBER', 'CUSTOMER');

-- DropForeignKey
ALTER TABLE "OAuthAccount" DROP CONSTRAINT "OAuthAccount_whitelabelUserId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_whitelabelUserId_fkey";

-- AlterTable
ALTER TABLE "OAuthAccount" DROP COLUMN "whitelabelUserId",
ADD COLUMN     "whiteLabelUserId" TEXT;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "whitelabelUserId",
ADD COLUMN     "whiteLabelUserId" TEXT;

-- DropTable
DROP TABLE "WhitelabelUser";

-- DropEnum
DROP TYPE "WhitelabelUserRole";

-- CreateTable
CREATE TABLE "WhiteLabel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelConfig" (
    "id" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelDomain" (
    "id" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelPartner" (
    "id" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelUser" (
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
    "role" "WhiteLabelUserRole" NOT NULL DEFAULT 'CUSTOMER',
    "whiteLabelId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_ownerId_key" ON "WhiteLabel"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelConfig_whiteLabelId_key" ON "WhiteLabelConfig"("whiteLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelDomain_whiteLabelId_key" ON "WhiteLabelDomain"("whiteLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelPartner_userId_key" ON "WhiteLabelPartner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelUser_email_key" ON "WhiteLabelUser"("email");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabel" ADD CONSTRAINT "WhiteLabel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelDomain" ADD CONSTRAINT "WhiteLabelDomain_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelPartner" ADD CONSTRAINT "WhiteLabelPartner_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelPartner" ADD CONSTRAINT "WhiteLabelPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelUser" ADD CONSTRAINT "WhiteLabelUser_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
