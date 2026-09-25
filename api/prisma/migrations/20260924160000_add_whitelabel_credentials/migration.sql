-- AlterTable
ALTER TABLE "WhiteLabel" ADD COLUMN "awsRegion" TEXT,
ADD COLUMN "awsAccessKeyId" TEXT,
ADD COLUMN "awsSecretAccessKey" TEXT,
ADD COLUMN "bucketName" TEXT,
ADD COLUMN "senderEmail" TEXT,
ADD COLUMN "databaseUrl" TEXT,
ADD COLUMN "redisUrl" TEXT,
ADD COLUMN "cloudflareApiToken" TEXT,
ADD COLUMN "cloudflareZoneId" TEXT,
ADD COLUMN "cloudflareBaseDomain" TEXT;
