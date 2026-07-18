/*
  Warnings:

  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `provider` on the `OAuthAccount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OAuthAccountProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_platformUserId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_workspaceUserId_fkey";

-- AlterTable
ALTER TABLE "OAuthAccount" DROP COLUMN "provider",
ADD COLUMN     "provider" "OAuthAccountProvider" NOT NULL;

-- AlterTable
ALTER TABLE "PlatformUser" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "WorkspaceUser" ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "VerificationToken";

-- DropEnum
DROP TYPE "AccountProvider";

-- DropEnum
DROP TYPE "VerificationType";
