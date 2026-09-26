export enum WhiteLabelBusinessType {
  DISTRIBUTOR_AGGREGATOR = "DISTRIBUTOR_AGGREGATOR",
  REFERRER = "REFERRER",
}

// Global Standard Onboarding Details: 1. Distributor / Aggregator
export interface DistributorAggregatorOnboardingData {
  catalogTrackCount?: number;
  monthlyTrackDelivery?: number;
  primaryDspChannels?: string[];
  currentDistributor?: string;
  ingestionProtocol?: "DDEX_ERN_4_3" | "DDEX_ERN_3_8" | "S3_DIRECT" | "SFTP_BATCH";
  deliveryLatencySla?: "FAST_TRACK_4H" | "STANDARD_48H" | "WEEKLY_BATCH";
  isrcModel?: "SYSTEM_AUTOMATED" | "CUSTOM_REGISTRANT" | "HYBRID_BYO";
  barcodeModel?: "AUTOMATED_EAN13" | "CLIENT_PROVIDED";
  subLabelsCount?: number;
  hasDedicatedQcTeam?: boolean;
  antiFraudInspectionRequired?: boolean;
  audioLosslessStandard?: boolean;
  metadataStrictTitleCase?: boolean;
  artworkComplianceStandard?: boolean;
  aggregatorCommissionCut?: number;
  automatedArtistPayouts?: boolean;
}

// Global Standard Onboarding Details: 2. Referrer / Affiliate Partner
export interface ReferrerOnboardingData {
  scoutAffiliateCodePrefix?: string;
  scoutNetworkCategory?: "talent_scout" | "recording_studio" | "music_attorney" | "management_agency" | "industry_influencer";
  targetTerritories?: string[];
  projectedMonthlyReferrals?: number;
  discoveryChannels?: string[];
  attributionWindowDays?: number | "lifetime";
  preferredCommissionStructure?: "lifetime_rev_share" | "upfront_bounty" | "hybrid_tiered";
  commissionBountyRate?: number;
  minimumPayoutThresholdUsd?: number;
  payoutMethod?: "WIRE_ACH" | "WISE" | "PAYPAL" | "USDT_CRYPTO" | "STRIPE_CONNECT";
}

export enum WhiteLabelUserRole {
  OWNER = "OWNER",
  PARTNER = "PARTNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  CLIENT = "CLIENT",
}

export enum WhiteLabelSignupModel {
  INVITE_ONLY = "INVITE_ONLY",
  ADMIN_APPROVAL = "ADMIN_APPROVAL",
  OPEN_REGISTRATION = "OPEN_REGISTRATION",
}

export enum WhiteLabelStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  PROCESSING = "PROCESSING",
  REJECTED = "REJECTED",
  CONTRACTED = "CONTRACTED",
  PAID = "PAID",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface WhiteLabelTopArtist {
  id: string;
  code: string;
  whiteLabelId: string;
  artistName: string;
  instagramHandle?: string | null;
  spotifyProfileUrl?: string | null;
  youtubeChannelUrl?: string | null;
  monthlyListeners?: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelDocument {
  id: string;
  code: string;
  whiteLabelId: string;
  type: string;
  name: string;
  fileKey: string;
  fileUrl?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabel {
  id: string;
  code: string;
  name: string;
  businessType: WhiteLabelBusinessType;
  companyWebsite?: string | null;
  country?: string | null;
  yearsInBusiness: number;
  isIncorporated: boolean;
  incorporationDocUrl?: string | null;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactLinkedIn?: string | null;
  catalogTrackCount: number;
  monthlyTrackDelivery: number;
  monthlyRevenueUsd?: number | null;
  hasDirectDeals: boolean;
  currentDistributors: string[];
  royaltySolutions: string[];
  primaryCatalogLanguage: string;
  wantsCatalogMigration: boolean;
  hasSampleBasedCovers: boolean;
  userSignupModel: WhiteLabelSignupModel;
  onboardingDetails?: Record<string, any> | null;
  privacyPolicyAccepted: boolean;
  marketingConsent: boolean;
  status: WhiteLabelStatus;
  statusReason?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  contractKey?: string | null;
  contractFileName?: string | null;
  contractFileSize?: number | null;
  contractUploadedAt?: string | null;
  contractUploadedBy?: string | null;
  contractPreviewUrl?: string | null;
  subscriptionId: string;
  subscription?: {
    id: string;
    code?: string;
    subscriberId?: string;
    subscriber?: {
      id: string;
      code: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    payments?: Array<{
      id: string;
      code?: string;
      amount: number;
      discount: number;
      status: string;
      startsAt: string;
      endsAt: string;
      createdAt: string;
    }>;
  } | null;
  payments?: Array<{
    id: string;
    code?: string;
    amount: number;
    discount: number;
    status: string;
    startsAt: string;
    endsAt: string;
    createdAt: string;
  }>;
  // Identity & Branding
  subdomain?: string | null;
  customDomain?: string | null;
  elasticIpv4?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  copyrightText?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  socialSpotify?: string | null;
  socialFacebook?: string | null;
  socialLinkedin?: string | null;
  socialTiktok?: string | null;

  // Dedicated Cloud & Infrastructure Credentials
  awsRegion?: string | null;
  awsAccessKeyId?: string | null;
  bucketName?: string | null;
  senderEmail?: string | null;
  awsKeyPairName?: string | null;
  awsKeyPairPrivateKey?: string | null;
  cloudflareZoneId?: string | null;
  cloudflareBaseDomain?: string | null;
  isSetupComplete?: boolean;
  isSetupCompleted?: boolean;

  artists?: WhiteLabelTopArtist[];
  documents?: WhiteLabelDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelBranding {
  id: string;
  code: string;
  name: string;
  status: WhiteLabelStatus;
  businessType?: WhiteLabelBusinessType | null;
  companyWebsite?: string | null;
  country?: string | null;
  yearsInBusiness?: number | null;
  isIncorporated?: boolean | null;
  incorporationDocUrl?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactEmail?: string | null;
  contactLinkedIn?: string | null;
  onboardingDetails?: Record<string, any> | null;
  subdomain?: string | null;
  customDomain?: string | null;
  elasticIpv4?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor: string;
  accentColor: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  copyrightText?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialYoutube?: string | null;
  socialSpotify?: string | null;
  socialFacebook?: string | null;
  socialLinkedin?: string | null;
  socialTiktok?: string | null;
  awsRegion?: string | null;
  awsAccessKeyId?: string | null;
  awsSecretAccessKey?: string | null;
  cloudflareApiToken?: string | null;
  cloudflareZoneId?: string | null;
  cloudflareBaseDomain?: string | null;
  cloudflareOriginCert?: string | null;
  cloudflareOriginKey?: string | null;
  senderEmail?: string | null;
  hasCloudflareCredentials?: boolean;
  expectedCustomDomain?: string | null;
  awsInstanceId?: string | null;
  awsElasticIp?: string | null;
  awsInstanceType?: string | null;
  awsInstanceState?: string | null;
  awsKeyPairName?: string | null;
  awsKeyPairPrivateKey?: string | null;
  s3BucketArn?: string | null;
  bucketName?: string | null;
  sesIdentityStatus?: string | null;
  provisioningStatus?: ProvisioningStatus | null;
  provisioningProgress?: number;
  provisioningStep?: string | null;
  provisionedAt?: string | null;
  provisioningError?: string | null;
  isSetupComplete?: boolean;
  isSetupCompleted?: boolean;
  hasOwner?: boolean;
  ownerCount?: number;
  themeRadius?: string;
  themeFont?: string;
  themeMode?: string;
  cardStyle?: string;
  navbarStyle?: string;
  userSignupModel?: WhiteLabelSignupModel;
}

export interface WhiteLabelTheme {
  primaryColor: string;
  accentColor: string;
  radius: string;
  mode: "light" | "dark" | "system";
  fontFamily: string;
  cardStyle: "modern" | "glass" | "flat" | "bordered";
  navbarStyle: "solid" | "glass" | "floating";
}

export interface WhiteLabelDomainStatus {
  verified: boolean;
  lastCheckedAt?: string | null;
  sslStatus:
    | "ACTIVE"
    | "PROVISIONING"
    | "NOT_CONFIGURED"
    | "PENDING_VERIFICATION"
    | "FAILED";
  dnsStatus:
    | "CONNECTED"
    | "PENDING_SETUP"
    | "PENDING_VERIFICATION"
    | "VERIFIED"
    | "ACTIVE";
  diagnostic?: string;
}

export interface WhiteLabelDomainConfig {
  subdomain?: string | null;
  platformSubdomainFqdn?: string | null;
  customDomain?: string | null;
  elasticIpv4?: string | null;
  domainVerificationToken?: string | null;
  cnameHost: string;
  cnameTarget?: string;
  txtRecordName: string;
  txtRecordValue: string;
  verified?: boolean;
  verifiedAt?: string | null;
  sslStatus?: string;
  status?: WhiteLabelDomainStatus;
  hasCloudflareCredentials?: boolean;
  cloudflareBaseDomain?: string | null;
  expectedCustomDomain?: string | null;
  cloudflareZoneId?: string | null;
  health?: DomainHealthReport | null;
}

export interface SubdomainHealthReport {
  status: "VERIFIED" | "FAILED" | "PENDING" | "NOT_CONFIGURED";
  subdomain: string;
  fqdn: string;
  isElasticIp: boolean;
  elasticIpv4?: string | null;
  expectedTarget: string;
  actualTarget?: string | null;
  recordType: "A" | "CNAME";
  proxied?: boolean;
  message: string;
}

export interface DomainHealthStep {
  status: "VERIFIED" | "FAILED" | "PENDING" | "NOT_CONFIGURED";
  title: string;
  message: string;
  details?: {
    zoneId?: string;
    zoneName?: string;
    zoneStatus?: string;
    hasDnsEditPermission?: boolean;
    nameServers?: string[];
    [key: string]: any;
  };
}

export interface DomainHealthReport {
  lastCheckedAt: string;
  allConnected: boolean;
  subdomain: SubdomainHealthReport;
  step1: DomainHealthStep;
  step2: DomainHealthStep & {
    heldDomain?: string;
    verificationToken?: string;
    txtRecord?: {
      host: string;
      fqdn: string;
      value: string;
    };
  };
  step3: DomainHealthStep & {
    cnameHost?: string;
    cnameFqdn?: string;
    target?: string;
    proxied?: boolean;
  };
}

export interface CloudflareInterconnectionResult {
  success: boolean;
  step: string;
  message: string;
  details?: {
    zoneId?: string;
    zoneName?: string;
    zoneStatus?: string;
    configuredBaseDomain?: string;
    targetCustomDomain?: string;
    hasDnsEditPermission?: boolean;
    nameServers?: string[];
  };
}

export interface DomainHoldResult {
  success: boolean;
  heldDomain?: string;
  domainVerified?: boolean;
  message: string;
  verificationToken?: string;
  txtRecord?: {
    name: string;
    fqdn: string;
    value: string;
  };
}

export interface DomainCnameResult {
  success: boolean;
  cnameHost?: string;
  cnameFqdn?: string;
  cnameTarget?: string;
  proxied?: boolean;
  recordId?: string;
  message: string;
  status?: WhiteLabelDomainStatus;
}

export interface WhiteLabelSsoConfig {
  userSignupModel: WhiteLabelSignupModel;
  googleEnabled: boolean;
  googleClientId: string;
  googleClientSecretMasked: string;
  githubEnabled: boolean;
  githubClientId: string;
  githubClientSecretMasked: string;
  enforce2fa: boolean;
  sessionTimeoutHours: number;

  // Dedicated Cloud & Infrastructure Credentials
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKeyMasked?: string;
  hasAwsSecretAccessKey?: boolean;
  bucketName?: string;
  senderEmail?: string;
  databaseUrlMasked?: string;
  hasDatabaseUrl?: boolean;
  redisUrlMasked?: string;
  hasRedisUrl?: boolean;
  cloudflareApiTokenMasked?: string;
  hasCloudflareApiToken?: boolean;
  cloudflareZoneId?: string;
  cloudflareBaseDomain?: string;
}

export interface WhiteLabelApiKey {
  id: string;
  code?: string;
  name: string;
  prefix: string;
  keyMasked?: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string | null;
  status: "ACTIVE" | "REVOKED";
}

export interface WhiteLabelWebhookConfig {
  url: string;
  events: string[];
  isActive: boolean;
  signingSecretMasked: string;
}

export interface WhiteLabelWebhookLog {
  id: string;
  event: string;
  url: string;
  statusCode: number;
  deliveredAt: string;
  success: boolean;
  responseSummary: string;
}

export enum ProvisioningStatus {
  NOT_STARTED = "NOT_STARTED",
  CREDENTIALS_VALIDATED = "CREDENTIALS_VALIDATED",
  STORAGE_PROVISIONED = "STORAGE_PROVISIONED",
  SES_CONFIGURED = "SES_CONFIGURED",
  EC2_LAUNCHING = "EC2_LAUNCHING",
  DNS_CONFIGURED = "DNS_CONFIGURED",
  DEPLOYING_APPLICATION = "DEPLOYING_APPLICATION",
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
}

export interface ProvisioningLogEntry {
  timestamp: string;
  step: string;
  message: string;
  status: "INFO" | "SUCCESS" | "WARN" | "ERROR";
}

export interface WhiteLabelProvisioningTelemetry {
  id: string;
  code: string;
  name: string;
  customDomain?: string | null;
  awsInstanceId?: string | null;
  awsElasticIp?: string | null;
  awsInstanceType?: string | null;
  awsInstanceState?: string | null;
  awsKeyPairName?: string | null;
  awsKeyPairPrivateKey?: string | null;
  cloudflareOriginCert?: string | null;
  cloudflareOriginKey?: string | null;
  s3CorsConfigured?: boolean;
  bucketName?: string | null;
  sesIdentityStatus?: string | null;
  provisioningStatus: ProvisioningStatus;
  provisioningProgress: number;
  provisioningStep?: string | null;
  provisioningLogs?: ProvisioningLogEntry[] | null;
  provisionedAt?: string | null;
  provisioningError?: string | null;
}
