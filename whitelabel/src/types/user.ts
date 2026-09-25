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

export enum WhiteLabelBusinessType {
  RECORD_LABEL = "RECORD_LABEL",
  DISTRIBUTOR_AGGREGATOR = "DISTRIBUTOR_AGGREGATOR",
  MUSIC_PUBLISHER = "MUSIC_PUBLISHER",
  REFERRER = "REFERRER",
}

export interface WhiteLabelUser {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  role: WhiteLabelUserRole;
  image?: string | null;
  twoFactorEnabled: boolean;
  isApproved?: boolean;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
}

export interface WhiteLabelTenant {
  id: string;
  code: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  elasticIpv4?: string | null;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  bannerUrl?: string | null;
  primaryColor?: string;
  accentColor?: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  copyrightText?: string | null;
  socials?: {
    instagram?: string | null;
    twitter?: string | null;
    youtube?: string | null;
    spotify?: string | null;
    facebook?: string | null;
    linkedin?: string | null;
    tiktok?: string | null;
  };
  userSignupModel?: WhiteLabelSignupModel | string;
  businessType?: WhiteLabelBusinessType | string;
  country?: string | null;
  status?: string;
  catalogTrackCount?: number;
  monthlyTrackDelivery?: number;
  monthlyRevenueUsd?: string | number | null;
  hasDirectDeals?: boolean;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    radius?: string;
    mode?: string;
    fontFamily?: string;
    cardStyle?: string;
    navbarStyle?: string;
  };
  sso?: {
    googleEnabled?: boolean;
    githubEnabled?: boolean;
    enforce2fa?: boolean;
    sessionTimeoutHours?: number;
  };
  domain?: {
    subdomain?: string | null;
    platformSubdomainFqdn?: string | null;
    customDomain?: string | null;
    cnameTarget?: string;
    verified?: boolean;
    sslStatus?: string;
  };
  isConfigured?: boolean;
  isSetupComplete?: boolean;
  hasOwner?: boolean;
  brandingConfigured?: boolean;
  onboardingDetails?: Record<string, any>;
  features?: {
    businessType?: WhiteLabelBusinessType | string;
    modules?: string[];
    limits?: Record<string, any>;
    capabilities?: Record<string, any>;
  };
}

export interface SessionItem {
  id: string;
  code: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  accessedAt: string;
  expiresAt: string;
  createdAt: string;
  isCurrent: boolean;
}
