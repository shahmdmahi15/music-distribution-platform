export enum WhiteLabelUserRole {
  OWNER = "OWNER",
  PARTNER = "PARTNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
  CLIENT = "CLIENT",
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
  userSignupModel?: string;
  businessType?: string;
  country?: string | null;
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
  };
  domain?: {
    subdomain?: string | null;
    customDomain?: string | null;
    cnameTarget?: string;
    verified?: boolean;
    sslStatus?: string;
  };
  isConfigured?: boolean;
  brandingConfigured?: boolean;
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
