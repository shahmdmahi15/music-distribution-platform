-- Performance indexes for the admin list filters and stats aggregates.
--
-- Every statement here is additive; no existing data is rewritten. Index
-- creation still takes a lock that blocks writes on the target table for the
-- duration, so on a large table prefer running these during a quiet window.

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
CREATE INDEX "WhiteLabel_status_idx" ON "WhiteLabel"("status");

-- CreateIndex
CREATE INDEX "WhiteLabel_businessType_idx" ON "WhiteLabel"("businessType");

-- CreateIndex
CREATE INDEX "WhiteLabel_createdAt_idx" ON "WhiteLabel"("createdAt");

-- CreateIndex
CREATE INDEX "Session_platformUserId_revokedAt_idx" ON "Session"("platformUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "PlatformSubscriptionPayment_subscriptionId_status_endsAt_idx" ON "PlatformSubscriptionPayment"("subscriptionId", "status", "endsAt");

-- CreateSequence
-- Human-readable record codes are drawn from these sequences instead of being
-- created on demand with runtime DDL. IF NOT EXISTS keeps environments where
-- the old runtime helper already created a sequence from resetting its value.
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
