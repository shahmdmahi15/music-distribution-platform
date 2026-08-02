/*
  Warnings:

  - You are about to drop the column `ownerId` on the `WhiteLabel` table. All the data in the column will be lost.
  - You are about to drop the `WhiteLabelConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WhiteLabelDomain` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[subscriptionId]` on the table `WhiteLabel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subscriptionId` to the `WhiteLabel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "WhiteLabel" DROP CONSTRAINT "WhiteLabel_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT "WhiteLabelConfig_whiteLabelId_fkey";

-- DropForeignKey
ALTER TABLE "WhiteLabelDomain" DROP CONSTRAINT "WhiteLabelDomain_whiteLabelId_fkey";

-- DropIndex
DROP INDEX "WhiteLabel_ownerId_key";

-- AlterTable
ALTER TABLE "WhiteLabel" DROP COLUMN "ownerId",
ADD COLUMN     "subscriptionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "WhiteLabelConfig";

-- DropTable
DROP TABLE "WhiteLabelDomain";

-- CreateTable
CREATE TABLE "PlatformSubscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscription_subscriberId_key" ON "PlatformSubscription"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_subscriptionId_key" ON "WhiteLabel"("subscriptionId");

-- AddForeignKey
ALTER TABLE "PlatformSubscription" ADD CONSTRAINT "PlatformSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSubscriptionPayment" ADD CONSTRAINT "PlatformSubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlatformSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabel" ADD CONSTRAINT "WhiteLabel_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlatformSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
