-- CreateEnum
CREATE TYPE "PlatformUserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "WhiteLabelUserRole" AS ENUM ('OWNER', 'PARTNER', 'ADMIN', 'MANAGER', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "OAuthAccountProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "WhiteLabelBusinessType" AS ENUM ('DISTRIBUTOR_AGGREGATOR');

-- CreateEnum
CREATE TYPE "WhiteLabelSignupModel" AS ENUM ('INVITE_ONLY', 'ADMIN_APPROVAL', 'OPEN_REGISTRATION');

-- CreateEnum
CREATE TYPE "WhiteLabelStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PROCESSING', 'REJECTED', 'CONTRACTED', 'PAID', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('NOT_STARTED', 'CREDENTIALS_VALIDATED', 'STORAGE_PROVISIONED', 'SES_CONFIGURED', 'EC2_LAUNCHING', 'DNS_CONFIGURED', 'DEPLOYING_APPLICATION', 'ACTIVE', 'FAILED');

-- CreateEnum
CREATE TYPE "ReleaseType" AS ENUM ('SINGLE', 'EP', 'ALBUM', 'MUSIC_VIDEO');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DISTRIBUTED', 'REJECTED', 'TAKEDOWN', 'NEEDS_FIX');

-- CreateEnum
CREATE TYPE "UpstreamProvider" AS ENUM ('ANS_MUSIC', 'REVELATOR_DIRECT', 'LOCAL_DDEX');

-- CreateEnum
CREATE TYPE "UpstreamStatus" AS ENUM ('PENDING', 'NEEDS_FIX', 'APPROVED', 'DELIVERED', 'REJECTED', 'TAKEN_DOWN');

-- CreateEnum
CREATE TYPE "VideoVersion" AS ENUM ('OFFICIAL', 'LYRIC', 'AUDIO', 'LIVE', 'INTERVIEW', 'BEHIND_THE_SCENES', 'TEASER', 'ORIGINAL');

-- CreateEnum
CREATE TYPE "VevoChannelStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('PRIMARY_ARTIST', 'FEATURED_ARTIST', 'PRODUCER', 'COMPOSER', 'LYRICIST', 'ARRANGER');

-- CreateEnum
CREATE TYPE "DistributionReportStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AudioScanStatus" AS ENUM ('PENDING', 'CLEAN', 'MATCH_FOUND', 'FAILED');

-- CreateEnum
CREATE TYPE "QcStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED_WARNINGS', 'FAILED_BLOCKING');

-- CreateEnum
CREATE TYPE "ContractLevel" AS ENUM ('ACCOUNT', 'LABEL', 'ARTIST', 'RELEASE', 'TRACK');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayeeStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PayeeRole" AS ENUM ('ARTIST', 'LABEL', 'PRODUCER', 'COMPOSER', 'PUBLISHER', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "MechanicalType" AS ENUM ('PERCENTAGE_OF_SALES', 'PENNY_RATE', 'COPYRIGHT_STATUTORY');

-- CreateEnum
CREATE TYPE "DspStore" AS ENUM ('SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE', 'AMAZON', 'DEEZER', 'TIKTOK', 'META', 'TIDAL', 'OTHER');

-- CreateEnum
CREATE TYPE "DspReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RoyaltyRunStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'LOCKED');

-- CreateEnum
CREATE TYPE "DdexVersion" AS ENUM ('ERN_382', 'ERN_42', 'ERN_43');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('QUEUED', 'PACKAGED', 'DISPATCHED', 'ACKNOWLEDGED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayoutGateway" AS ENUM ('TIPALTI', 'STRIPE_CONNECT', 'WISE', 'MANUAL_BANK', 'BKASH');

-- CreateEnum
CREATE TYPE "ReferrerStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PROCESSING', 'REJECTED', 'CONTRACTED', 'PAID', 'ACTIVE', 'SUSPENDED');

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
    "referredByReferralCode" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedPasswordResetAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedTwoFactorAttempts" INTEGER NOT NULL DEFAULT 0,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "role" "PlatformUserRole" NOT NULL DEFAULT 'CLIENT',
    "referredByReferrerId" TEXT,
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
    "businessType" "WhiteLabelBusinessType" NOT NULL DEFAULT 'DISTRIBUTOR_AGGREGATOR',
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
    "elasticIpv4" TEXT,
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
    "awsRegion" TEXT,
    "awsAccessKeyId" TEXT,
    "awsSecretAccessKey" TEXT,
    "bucketName" TEXT,
    "senderEmail" TEXT,
    "databaseUrl" TEXT,
    "redisUrl" TEXT,
    "cloudflareApiToken" TEXT,
    "cloudflareZoneId" TEXT,
    "cloudflareBaseDomain" TEXT,
    "cloudflareOriginCert" TEXT,
    "cloudflareOriginKey" TEXT,
    "awsInstanceId" TEXT,
    "awsElasticIp" TEXT,
    "awsAllocationId" TEXT,
    "awsSecurityGroupId" TEXT,
    "awsKeyPairName" TEXT,
    "awsKeyPairPrivateKey" TEXT,
    "awsInstanceType" TEXT DEFAULT 't4g.medium',
    "awsInstanceState" TEXT DEFAULT 'STOPPED',
    "s3BucketArn" TEXT,
    "s3CorsConfigured" BOOLEAN NOT NULL DEFAULT false,
    "sesIdentityStatus" TEXT DEFAULT 'PENDING',
    "sesDkimTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provisioningStatus" "ProvisioningStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "provisioningProgress" INTEGER NOT NULL DEFAULT 0,
    "provisioningStep" TEXT,
    "provisioningLogs" JSONB,
    "provisionedAt" TIMESTAMP(3),
    "provisioningError" TEXT,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "contactEmail" TEXT,
    "contactWhatsApp" TEXT,
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
    "onboardingDetails" JSONB,
    "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT true,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
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
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "role" "WhiteLabelUserRole" NOT NULL DEFAULT 'CLIENT',
    "whiteLabelId" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
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

-- CreateTable
CREATE TABLE "Referrer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "country" TEXT,
    "yearsInBusiness" INTEGER NOT NULL DEFAULT 0,
    "isIncorporated" BOOLEAN NOT NULL DEFAULT false,
    "incorporationDocUrl" TEXT,
    "contactFirstName" TEXT NOT NULL,
    "contactLastName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contactWhatsApp" TEXT,
    "contactLinkedIn" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "dealBenchmarkBdt" INTEGER NOT NULL DEFAULT 60000,
    "minGuaranteedBountyBdt" INTEGER NOT NULL DEFAULT 9000,
    "operatingHub" TEXT NOT NULL DEFAULT 'platform.royalmotionit.com/referrer',
    "payoutMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "bankName" TEXT,
    "accountName" TEXT,
    "accountNumber" TEXT,
    "branchDistrict" TEXT,
    "branchName" TEXT,
    "routingNumber" TEXT,
    "swiftCode" TEXT,
    "walletNumber" TEXT,
    "status" "ReferrerStatus" NOT NULL DEFAULT 'PENDING',
    "statusReason" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "contractKey" TEXT,
    "contractFileName" TEXT,
    "contractFileSize" INTEGER,
    "contractUploadedAt" TIMESTAMP(3),
    "contractUploadedBy" TEXT,
    "onboardingDetails" JSONB,
    "adminNotes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referrer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferrerDocument" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'OTHER',
    "referrerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferrerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferrerDeal" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "sellingPriceBdt" INTEGER NOT NULL,
    "referrerBountyBdt" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referrerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferrerDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Release" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReleaseType" NOT NULL DEFAULT 'SINGLE',
    "upc" TEXT,
    "catalogNumber" TEXT,
    "releaseDate" TIMESTAMP(3),
    "originalReleaseDate" TIMESTAMP(3),
    "genre" TEXT NOT NULL,
    "subgenre" TEXT,
    "labelName" TEXT,
    "cLine" TEXT,
    "pLine" TEXT,
    "coverArtKey" TEXT,
    "coverArtUrl" TEXT,
    "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "adminNotes" TEXT,
    "qcStatus" "QcStatus" NOT NULL DEFAULT 'PENDING',
    "validationErrors" JSONB,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "upstreamProvider" "UpstreamProvider",
    "upstreamReleaseId" TEXT,
    "upstreamVideoId" TEXT,
    "upstreamStatus" "UpstreamStatus",
    "upstreamReason" TEXT,
    "youtubeVideoId" TEXT,
    "youtubeWatchUrl" TEXT,
    "isrcAssignedByUpstream" BOOLEAN NOT NULL DEFAULT false,
    "upcAssignedByUpstream" BOOLEAN NOT NULL DEFAULT false,
    "videoVersion" "VideoVersion",
    "videoUrl" TEXT,
    "vevoChannelName" TEXT,
    "submittedAt" TIMESTAMP(3),
    "distributedAt" TIMESTAMP(3),
    "whiteLabelId" TEXT NOT NULL,
    "whiteLabelUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trackNumber" INTEGER NOT NULL DEFAULT 1,
    "discNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "version" TEXT,
    "isrc" TEXT,
    "iswc" TEXT,
    "durationSeconds" INTEGER,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "audioKey" TEXT,
    "audioUrl" TEXT,
    "fileName" TEXT,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "lyrics" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "phoneticTitle" TEXT,
    "phoneticVersion" TEXT,
    "languageScriptCode" TEXT,
    "releaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseContributor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ContributorRole" NOT NULL DEFAULT 'PRIMARY_ARTIST',
    "spotifyId" TEXT,
    "appleMusicId" TEXT,
    "releaseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReleaseContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackContributor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ContributorRole" NOT NULL DEFAULT 'PRIMARY_ARTIST',
    "spotifyId" TEXT,
    "appleMusicId" TEXT,
    "trackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionReport" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "totalRevenueBdt" DECIMAL(14,2),
    "totalRevenueUsd" DECIMAL(14,2),
    "totalStreams" BIGINT DEFAULT 0,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSizeBytes" INTEGER,
    "mimeType" TEXT,
    "status" "DistributionReportStatus" NOT NULL DEFAULT 'PUBLISHED',
    "notes" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "whiteLabelId" TEXT NOT NULL,
    "uploadedByPlatformUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackAudioScan" (
    "id" TEXT NOT NULL,
    "status" "AudioScanStatus" NOT NULL DEFAULT 'PENDING',
    "matchScore" INTEGER,
    "matchedTitle" TEXT,
    "matchedArtist" TEXT,
    "matchedAlbum" TEXT,
    "matchedIsrc" TEXT,
    "matchedLabel" TEXT,
    "externalIds" JSONB,
    "rawMetadata" JSONB,
    "errorMessage" TEXT,
    "trackId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackAudioScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "role" "PayeeRole" NOT NULL DEFAULT 'ARTIST',
    "status" "PayeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "paymentMethod" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "paymentDetails" JSONB,
    "whiteLabelId" TEXT NOT NULL,
    "whiteLabelUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "level" "ContractLevel" NOT NULL DEFAULT 'RELEASE',
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "allFutureAssets" BOOLEAN NOT NULL DEFAULT false,
    "payMechanicals" BOOLEAN NOT NULL DEFAULT false,
    "mechanicalType" "MechanicalType",
    "mechanicalRate" DECIMAL(10,4),
    "advanceAmount" DECIMAL(14,2) DEFAULT 0,
    "recoupedAmount" DECIMAL(14,2) DEFAULT 0,
    "isRecouped" BOOLEAN NOT NULL DEFAULT true,
    "whiteLabelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractPayee" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "sharePercentage" DECIMAL(5,2) NOT NULL,
    "role" "PayeeRole" NOT NULL DEFAULT 'ARTIST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractPayee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAsset" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "releaseId" TEXT,
    "trackId" TEXT,
    "artistName" TEXT,
    "labelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DspRawReport" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "store" "DspStore" NOT NULL DEFAULT 'OTHER',
    "reportingPeriod" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileSizeBytes" INTEGER,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
    "totalLines" INTEGER NOT NULL DEFAULT 0,
    "totalGrossUsd" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalNetUsd" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "status" "DspReportStatus" NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,
    "uploadedByPlatformUserId" TEXT,
    "whiteLabelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DspRawReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DspSaleLine" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "store" "DspStore" NOT NULL DEFAULT 'OTHER',
    "reportingPeriod" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'US',
    "isrc" TEXT,
    "upc" TEXT,
    "trackTitle" TEXT,
    "artistName" TEXT,
    "streamCount" BIGINT NOT NULL DEFAULT 0,
    "downloadCount" BIGINT NOT NULL DEFAULT 0,
    "grossAmountUsd" DECIMAL(12,4) NOT NULL,
    "netAmountUsd" DECIMAL(12,4) NOT NULL,
    "matchedTrackId" TEXT,
    "matchedReleaseId" TEXT,
    "whiteLabelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DspSaleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoyaltyRun" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exchangeRateUsdToBdt" DECIMAL(10,4) NOT NULL DEFAULT 120.0,
    "totalRawGrossUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalNetPayoutUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalNetPayoutBdt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "RoyaltyRunStatus" NOT NULL DEFAULT 'QUEUED',
    "processedAt" TIMESTAMP(3),
    "whiteLabelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoyaltyRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoyaltyStatement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "royaltyRunId" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "grossEarningsUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netEarningsUsd" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netEarningsBdt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "streamCount" BIGINT NOT NULL DEFAULT 0,
    "downloadCount" BIGINT NOT NULL DEFAULT 0,
    "statementFileKey" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoyaltyStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DspDeliveryPackage" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "targetDsp" "DspStore" NOT NULL DEFAULT 'SPOTIFY',
    "ddexVersion" "DdexVersion" NOT NULL DEFAULT 'ERN_43',
    "xmlManifestKey" TEXT,
    "packageZipKey" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'QUEUED',
    "batchId" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "dspFeedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DspDeliveryPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayeePayoutRequest" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "whiteLabelId" TEXT NOT NULL,
    "amountUsd" DECIMAL(12,2) NOT NULL,
    "amountBdt" DECIMAL(12,2) NOT NULL,
    "gateway" "PayoutGateway" NOT NULL DEFAULT 'MANUAL_BANK',
    "status" "PayoutStatus" NOT NULL DEFAULT 'REQUESTED',
    "externalReference" TEXT,
    "taxWithholdingUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transactionFeeUsd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayeePayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VevoChannel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "artistName" TEXT,
    "description" TEXT,
    "keywords" TEXT[],
    "status" "VevoChannelStatus" NOT NULL DEFAULT 'PENDING',
    "channelUrl" TEXT,
    "youtubeChannelId" TEXT,
    "upstreamChannelId" TEXT,
    "whiteLabelId" TEXT NOT NULL,
    "whiteLabelUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VevoChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpstreamWebhookLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'live',
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,

    CONSTRAINT "UpstreamWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_code_key" ON "OAuthAccount"("code");

-- CreateIndex
CREATE INDEX "OAuthAccount_platformUserId_idx" ON "OAuthAccount"("platformUserId");

-- CreateIndex
CREATE INDEX "OAuthAccount_whiteLabelUserId_idx" ON "OAuthAccount"("whiteLabelUserId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_accountId_key" ON "OAuthAccount"("provider", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_code_key" ON "Session"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_platformUserId_revokedAt_idx" ON "Session"("platformUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_whiteLabelUserId_revokedAt_idx" ON "Session"("whiteLabelUserId", "revokedAt");

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
CREATE INDEX "PlatformUser_referredByReferrerId_idx" ON "PlatformUser"("referredByReferrerId");

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
CREATE INDEX "WhiteLabelUser_whiteLabelId_idx" ON "WhiteLabelUser"("whiteLabelId");

-- CreateIndex
CREATE INDEX "WhiteLabelUser_whiteLabelId_role_idx" ON "WhiteLabelUser"("whiteLabelId", "role");

-- CreateIndex
CREATE INDEX "WhiteLabelUser_emailVerified_idx" ON "WhiteLabelUser"("emailVerified");

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
CREATE UNIQUE INDEX "Referrer_code_key" ON "Referrer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_referralCode_key" ON "Referrer"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_userId_key" ON "Referrer"("userId");

-- CreateIndex
CREATE INDEX "Referrer_status_idx" ON "Referrer"("status");

-- CreateIndex
CREATE INDEX "Referrer_createdAt_idx" ON "Referrer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerDocument_code_key" ON "ReferrerDocument"("code");

-- CreateIndex
CREATE INDEX "ReferrerDocument_referrerId_idx" ON "ReferrerDocument"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferrerDeal_code_key" ON "ReferrerDeal"("code");

-- CreateIndex
CREATE INDEX "ReferrerDeal_referrerId_idx" ON "ReferrerDeal"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "Release_code_key" ON "Release"("code");

-- CreateIndex
CREATE INDEX "Release_whiteLabelId_status_idx" ON "Release"("whiteLabelId", "status");

-- CreateIndex
CREATE INDEX "Release_status_idx" ON "Release"("status");

-- CreateIndex
CREATE INDEX "Release_createdAt_idx" ON "Release"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Track_code_key" ON "Track"("code");

-- CreateIndex
CREATE INDEX "Track_releaseId_idx" ON "Track"("releaseId");

-- CreateIndex
CREATE INDEX "Track_isrc_idx" ON "Track"("isrc");

-- CreateIndex
CREATE INDEX "ReleaseContributor_releaseId_idx" ON "ReleaseContributor"("releaseId");

-- CreateIndex
CREATE INDEX "TrackContributor_trackId_idx" ON "TrackContributor"("trackId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionReport_code_key" ON "DistributionReport"("code");

-- CreateIndex
CREATE INDEX "DistributionReport_whiteLabelId_reportingPeriod_idx" ON "DistributionReport"("whiteLabelId", "reportingPeriod");

-- CreateIndex
CREATE INDEX "DistributionReport_whiteLabelId_status_idx" ON "DistributionReport"("whiteLabelId", "status");

-- CreateIndex
CREATE INDEX "DistributionReport_createdAt_idx" ON "DistributionReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackAudioScan_trackId_key" ON "TrackAudioScan"("trackId");

-- CreateIndex
CREATE INDEX "TrackAudioScan_status_idx" ON "TrackAudioScan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payee_code_key" ON "Payee"("code");

-- CreateIndex
CREATE INDEX "Payee_whiteLabelId_idx" ON "Payee"("whiteLabelId");

-- CreateIndex
CREATE INDEX "Payee_whiteLabelUserId_idx" ON "Payee"("whiteLabelUserId");

-- CreateIndex
CREATE INDEX "Payee_email_idx" ON "Payee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code");

-- CreateIndex
CREATE INDEX "Contract_whiteLabelId_idx" ON "Contract"("whiteLabelId");

-- CreateIndex
CREATE INDEX "Contract_level_idx" ON "Contract"("level");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "ContractPayee_contractId_idx" ON "ContractPayee"("contractId");

-- CreateIndex
CREATE INDEX "ContractPayee_payeeId_idx" ON "ContractPayee"("payeeId");

-- CreateIndex
CREATE INDEX "ContractAsset_contractId_idx" ON "ContractAsset"("contractId");

-- CreateIndex
CREATE INDEX "ContractAsset_releaseId_idx" ON "ContractAsset"("releaseId");

-- CreateIndex
CREATE INDEX "ContractAsset_trackId_idx" ON "ContractAsset"("trackId");

-- CreateIndex
CREATE INDEX "ContractAsset_artistName_idx" ON "ContractAsset"("artistName");

-- CreateIndex
CREATE INDEX "ContractAsset_labelName_idx" ON "ContractAsset"("labelName");

-- CreateIndex
CREATE UNIQUE INDEX "DspRawReport_code_key" ON "DspRawReport"("code");

-- CreateIndex
CREATE INDEX "DspRawReport_store_reportingPeriod_idx" ON "DspRawReport"("store", "reportingPeriod");

-- CreateIndex
CREATE INDEX "DspRawReport_status_idx" ON "DspRawReport"("status");

-- CreateIndex
CREATE INDEX "DspRawReport_whiteLabelId_idx" ON "DspRawReport"("whiteLabelId");

-- CreateIndex
CREATE INDEX "DspRawReport_createdAt_idx" ON "DspRawReport"("createdAt");

-- CreateIndex
CREATE INDEX "DspSaleLine_reportId_idx" ON "DspSaleLine"("reportId");

-- CreateIndex
CREATE INDEX "DspSaleLine_isrc_idx" ON "DspSaleLine"("isrc");

-- CreateIndex
CREATE INDEX "DspSaleLine_upc_idx" ON "DspSaleLine"("upc");

-- CreateIndex
CREATE INDEX "DspSaleLine_matchedTrackId_idx" ON "DspSaleLine"("matchedTrackId");

-- CreateIndex
CREATE INDEX "DspSaleLine_matchedReleaseId_idx" ON "DspSaleLine"("matchedReleaseId");

-- CreateIndex
CREATE INDEX "DspSaleLine_whiteLabelId_idx" ON "DspSaleLine"("whiteLabelId");

-- CreateIndex
CREATE INDEX "DspSaleLine_reportingPeriod_idx" ON "DspSaleLine"("reportingPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "RoyaltyRun_code_key" ON "RoyaltyRun"("code");

-- CreateIndex
CREATE INDEX "RoyaltyRun_reportingPeriod_idx" ON "RoyaltyRun"("reportingPeriod");

-- CreateIndex
CREATE INDEX "RoyaltyRun_status_idx" ON "RoyaltyRun"("status");

-- CreateIndex
CREATE INDEX "RoyaltyRun_whiteLabelId_idx" ON "RoyaltyRun"("whiteLabelId");

-- CreateIndex
CREATE INDEX "RoyaltyRun_createdAt_idx" ON "RoyaltyRun"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoyaltyStatement_code_key" ON "UserRoyaltyStatement"("code");

-- CreateIndex
CREATE INDEX "UserRoyaltyStatement_royaltyRunId_idx" ON "UserRoyaltyStatement"("royaltyRunId");

-- CreateIndex
CREATE INDEX "UserRoyaltyStatement_payeeId_idx" ON "UserRoyaltyStatement"("payeeId");

-- CreateIndex
CREATE INDEX "UserRoyaltyStatement_whiteLabelId_idx" ON "UserRoyaltyStatement"("whiteLabelId");

-- CreateIndex
CREATE INDEX "UserRoyaltyStatement_reportingPeriod_idx" ON "UserRoyaltyStatement"("reportingPeriod");

-- CreateIndex
CREATE INDEX "UserRoyaltyStatement_isPaid_idx" ON "UserRoyaltyStatement"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "DspDeliveryPackage_code_key" ON "DspDeliveryPackage"("code");

-- CreateIndex
CREATE INDEX "DspDeliveryPackage_releaseId_idx" ON "DspDeliveryPackage"("releaseId");

-- CreateIndex
CREATE INDEX "DspDeliveryPackage_whiteLabelId_idx" ON "DspDeliveryPackage"("whiteLabelId");

-- CreateIndex
CREATE INDEX "DspDeliveryPackage_targetDsp_idx" ON "DspDeliveryPackage"("targetDsp");

-- CreateIndex
CREATE INDEX "DspDeliveryPackage_status_idx" ON "DspDeliveryPackage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayeePayoutRequest_code_key" ON "PayeePayoutRequest"("code");

-- CreateIndex
CREATE INDEX "PayeePayoutRequest_payeeId_idx" ON "PayeePayoutRequest"("payeeId");

-- CreateIndex
CREATE INDEX "PayeePayoutRequest_whiteLabelId_idx" ON "PayeePayoutRequest"("whiteLabelId");

-- CreateIndex
CREATE INDEX "PayeePayoutRequest_status_idx" ON "PayeePayoutRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VevoChannel_code_key" ON "VevoChannel"("code");

-- CreateIndex
CREATE INDEX "VevoChannel_whiteLabelId_idx" ON "VevoChannel"("whiteLabelId");

-- CreateIndex
CREATE INDEX "VevoChannel_channelName_idx" ON "VevoChannel"("channelName");

-- CreateIndex
CREATE UNIQUE INDEX "UpstreamWebhookLog_eventId_key" ON "UpstreamWebhookLog"("eventId");

-- CreateIndex
CREATE INDEX "UpstreamWebhookLog_eventType_idx" ON "UpstreamWebhookLog"("eventType");

-- CreateIndex
CREATE INDEX "UpstreamWebhookLog_processedAt_idx" ON "UpstreamWebhookLog"("processedAt");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformUser" ADD CONSTRAINT "PlatformUser_referredByReferrerId_fkey" FOREIGN KEY ("referredByReferrerId") REFERENCES "Referrer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Referrer" ADD CONSTRAINT "Referrer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferrerDocument" ADD CONSTRAINT "ReferrerDocument_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferrerDeal" ADD CONSTRAINT "ReferrerDeal_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Referrer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReleaseContributor" ADD CONSTRAINT "ReleaseContributor_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackContributor" ADD CONSTRAINT "TrackContributor_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionReport" ADD CONSTRAINT "DistributionReport_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributionReport" ADD CONSTRAINT "DistributionReport_uploadedByPlatformUserId_fkey" FOREIGN KEY ("uploadedByPlatformUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackAudioScan" ADD CONSTRAINT "TrackAudioScan_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payee" ADD CONSTRAINT "Payee_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payee" ADD CONSTRAINT "Payee_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPayee" ADD CONSTRAINT "ContractPayee_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPayee" ADD CONSTRAINT "ContractPayee_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAsset" ADD CONSTRAINT "ContractAsset_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DspRawReport" ADD CONSTRAINT "DspRawReport_uploadedByPlatformUserId_fkey" FOREIGN KEY ("uploadedByPlatformUserId") REFERENCES "PlatformUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DspRawReport" ADD CONSTRAINT "DspRawReport_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DspSaleLine" ADD CONSTRAINT "DspSaleLine_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DspRawReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoyaltyRun" ADD CONSTRAINT "RoyaltyRun_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyStatement" ADD CONSTRAINT "UserRoyaltyStatement_royaltyRunId_fkey" FOREIGN KEY ("royaltyRunId") REFERENCES "RoyaltyRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyStatement" ADD CONSTRAINT "UserRoyaltyStatement_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoyaltyStatement" ADD CONSTRAINT "UserRoyaltyStatement_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DspDeliveryPackage" ADD CONSTRAINT "DspDeliveryPackage_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DspDeliveryPackage" ADD CONSTRAINT "DspDeliveryPackage_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayeePayoutRequest" ADD CONSTRAINT "PayeePayoutRequest_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "Payee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayeePayoutRequest" ADD CONSTRAINT "PayeePayoutRequest_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VevoChannel" ADD CONSTRAINT "VevoChannel_whiteLabelId_fkey" FOREIGN KEY ("whiteLabelId") REFERENCES "WhiteLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VevoChannel" ADD CONSTRAINT "VevoChannel_whiteLabelUserId_fkey" FOREIGN KEY ("whiteLabelUserId") REFERENCES "WhiteLabelUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
