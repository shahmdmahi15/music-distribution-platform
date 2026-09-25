-- CreateEnum
CREATE TYPE "PlatformUserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "WhiteLabelUserRole" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "OAuthAccountProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WhiteLabelBusinessType" AS ENUM ('RECORD_LABEL', 'DISTRIBUTOR_AGGREGATOR', 'MUSIC_PUBLISHER', 'OTHER');

-- CreateEnum
CREATE TYPE "WhiteLabelSignupModel" AS ENUM ('OPEN_PUBLIC', 'INVITE_ONLY', 'VETTED_APPLICATION', 'MANUAL_APPROVAL');

-- CreateEnum
CREATE TYPE "WhiteLabelStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PROCESSING', 'REJECTED', 'CONTRACTED', 'PAID', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "provider" "OAuthAccountProvider" NOT NULL,
    "platformUserId" TEXT,
    "whiteLabelUserId" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "revokeReason" TEXT,
    "platformUserId" TEXT,
    "whiteLabelUserId" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformUser" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedPasswordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedTwoFactorAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" "PlatformUserRole" NOT NULL DEFAULT 'CLIENT',
    "lastLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSubscription" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "subscriptionId" TEXT NOT NULL,
    "paymentMethod" TEXT DEFAULT 'OFFLINE_MANUAL',
    "receiptReference" TEXT,
    "adminNotes" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" "WhiteLabelBusinessType" NOT NULL DEFAULT 'RECORD_LABEL',
    "companyWebsite" TEXT,
    "country" TEXT,
    "yearsInBusiness" INTEGER NOT NULL DEFAULT 0,
    "isIncorporated" BOOLEAN NOT NULL DEFAULT false,
    "incorporationDocUrl" TEXT,
    "subdomain" TEXT,
    "customDomain" TEXT,
    "domainVerificationToken" TEXT,
    "domainVerified" BOOLEAN NOT NULL DEFAULT false,
    "domainVerifiedAt" TIMESTAMP(3),
    "domainSslStatus" TEXT DEFAULT 'NOT_CONFIGURED',
    "tagline" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "logoDarkUrl" TEXT,
    "faviconUrl" TEXT,
    "bannerUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#6366f1',
    "accentColor" TEXT DEFAULT '#ec4899',
    "themeRadius" TEXT DEFAULT '0.5rem',
    "themeFont" TEXT DEFAULT 'Inter',
    "themeMode" TEXT DEFAULT 'dark',
    "navbarStyle" TEXT DEFAULT 'glass',
    "cardStyle" TEXT DEFAULT 'modern',
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "copyrightText" TEXT,
    "socialInstagram" TEXT,
    "socialTwitter" TEXT,
    "socialYoutube" TEXT,
    "socialSpotify" TEXT,
    "socialFacebook" TEXT,
    "socialLinkedin" TEXT,
    "socialTiktok" TEXT,
    "ssoGoogleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ssoGithubEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ssoEnforce2fa" BOOLEAN NOT NULL DEFAULT false,
    "ssoSessionTimeoutHours" INTEGER NOT NULL DEFAULT 72,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "contactEmail" TEXT,
    "contactLinkedIn" TEXT,
    "catalogTrackCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyTrackDelivery" INTEGER NOT NULL DEFAULT 0,
    "monthlyRevenueUsd" DECIMAL(14,2),
    "hasDirectDeals" BOOLEAN NOT NULL DEFAULT false,
    "currentDistributors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "royaltySolutions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryCatalogLanguage" TEXT NOT NULL DEFAULT 'en',
    "wantsCatalogMigration" BOOLEAN NOT NULL DEFAULT false,
    "hasSampleBasedCovers" BOOLEAN NOT NULL DEFAULT false,
    "userSignupModel" "WhiteLabelSignupModel" NOT NULL DEFAULT 'INVITE_ONLY',
    "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "WhiteLabelStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "contractKey" TEXT,
    "contractFileName" TEXT,
    "contractFileSize" INTEGER,
    "contractUploadedAt" TIMESTAMP(3),
    "contractUploadedBy" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelTopArtist" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "instagramHandle" TEXT,
    "spotifyProfileUrl" TEXT,
    "youtubeChannelUrl" TEXT,
    "monthlyListeners" INTEGER,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelTopArtist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSizeBytes" INTEGER,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelUser" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "image" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedPasswordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedTwoFactorAttempts" INTEGER NOT NULL DEFAULT 0,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" "WhiteLabelUserRole" NOT NULL DEFAULT 'CLIENT',
    "whiteLabelId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelPartner" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelApiKey" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyMasked" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['*']::TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_code_key" ON "OAuthAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Session_code_key" ON "Session"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_platformUserId_revokedAt_idx" ON "Session"("platformUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_code_key" ON "PlatformUser"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformUser_email_key" ON "PlatformUser"("email");

-- CreateIndex
CREATE INDEX "PlatformUser_role_idx" ON "PlatformUser"("role");

-- CreateIndex
CREATE INDEX "PlatformUser_lockedUntil_idx" ON "PlatformUser"("lockedUntil");

-- CreateIndex
CREATE INDEX "PlatformUser_emailVerified_idx" ON "PlatformUser"("emailVerified");

-- CreateIndex
CREATE INDEX "PlatformUser_twoFactorEnabled_idx" ON "PlatformUser"("twoFactorEnabled");

-- CreateIndex
CREATE INDEX "PlatformUser_createdAt_idx" ON "PlatformUser"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscription_code_key" ON "PlatformSubscription"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscription_subscriberId_key" ON "PlatformSubscription"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSubscriptionPayment_code_key" ON "PlatformSubscriptionPayment"("code");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPayment_subscriptionId_status_endsAt_idx" ON "PlatformSubscriptionPayment"("subscriptionId", "status", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_code_key" ON "WhiteLabel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_subdomain_key" ON "WhiteLabel"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_customDomain_key" ON "WhiteLabel"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabel_subscriptionId_key" ON "WhiteLabel"("subscriptionId");

-- CreateIndex
CREATE INDEX "WhiteLabel_status_idx" ON "WhiteLabel"("status");

-- CreateIndex
CREATE INDEX "WhiteLabel_businessType_idx" ON "WhiteLabel"("businessType");

-- CreateIndex
CREATE INDEX "WhiteLabel_createdAt_idx" ON "WhiteLabel"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelTopArtist_code_key" ON "WhiteLabelTopArtist"("code");

-- CreateIndex
CREATE INDEX "WhiteLabelTopArtist_whiteLabelId_idx" ON "WhiteLabelTopArtist"("whiteLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelDocument_code_key" ON "WhiteLabelDocument"("code");

-- CreateIndex
CREATE INDEX "WhiteLabelDocument_whiteLabelId_idx" ON "WhiteLabelDocument"("whiteLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelUser_code_key" ON "WhiteLabelUser"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelUser_email_whiteLabelId_key" ON "WhiteLabelUser"("email", "whiteLabelId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelPartner_code_key" ON "WhiteLabelPartner"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelPartner_userId_key" ON "WhiteLabelPartner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelApiKey_code_key" ON "WhiteLabelApiKey"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelApiKey_keyHash_key" ON "WhiteLabelApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "WhiteLabelApiKey_whiteLabelId_isActive_idx" ON "WhiteLabelApiKey"("whiteLabelId", "isActive");

-- CreateIndex
CREATE INDEX "WhiteLabelApiKey_keyHash_idx" ON "WhiteLabelApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSubscription" ADD CONSTRAINT "PlatformSubscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSubscriptionPayment" ADD CONSTRAINT "PlatformSubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlatformSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabel" ADD CONSTRAINT "WhiteLabel_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PlatformSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelTopArtist" ADD CONSTRAINT "WhiteLabelTopArtist_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelDocument" ADD CONSTRAINT "WhiteLabelDocument_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelUser" ADD CONSTRAINT "WhiteLabelUser_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelPartner" ADD CONSTRAINT "WhiteLabelPartner_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelPartner" ADD CONSTRAINT "WhiteLabelPartner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelApiKey" ADD CONSTRAINT "WhiteLabelApiKey_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateSequences for code generation
CREATE SEQUENCE IF NOT EXISTS "platformuser_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "whitelabeluser_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "whitelabel_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "platformsubscription_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "platformsubscriptionpayment_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "session_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "oauthaccount_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "whitelabelpartner_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "whitelabeltopartist_code_seq" START 1;
CREATE SEQUENCE IF NOT EXISTS "whitelabeldocument_code_seq" START 1;
