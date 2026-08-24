export enum WhiteLabelBusinessType {
  RECORD_LABEL = "RECORD_LABEL",
  DISTRIBUTOR_AGGREGATOR = "DISTRIBUTOR_AGGREGATOR",
  MUSIC_PUBLISHER = "MUSIC_PUBLISHER",
  OTHER = "OTHER",
}

export enum WhiteLabelSignupModel {
  OPEN_PUBLIC = "OPEN_PUBLIC",
  INVITE_ONLY = "INVITE_ONLY",
  VETTED_APPLICATION = "VETTED_APPLICATION",
  MANUAL_APPROVAL = "MANUAL_APPROVAL",
}

export enum WhiteLabelStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
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
  privacyPolicyAccepted: boolean;
  marketingConsent: boolean;
  status: WhiteLabelStatus;
  statusReason?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
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
  subdomain?: string | null;
  customDomain?: string | null;
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
}

