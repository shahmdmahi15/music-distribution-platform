export enum ReferrerStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  PROCESSING = "PROCESSING",
  REJECTED = "REJECTED",
  CONTRACTED = "CONTRACTED",
  PAID = "PAID",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export interface ReferrerDocument {
  id: string;
  code: string;
  name: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  docType: string;
  fileUrl?: string | null;
  referrerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferrerDeal {
  id: string;
  code: string;
  clientName: string;
  clientEmail?: string | null;
  sellingPriceBdt: number;
  referrerBountyBdt: number; // 15% of sellingPriceBdt
  status: "PENDING" | "PAID" | "CANCELLED" | string;
  referrerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referrer {
  id: string;
  code: string;
  referralCode: string;
  name: string;

  // Agency & Corporate Profile
  companyWebsite?: string | null;
  country?: string | null;
  yearsInBusiness: number;
  isIncorporated: boolean;
  incorporationDocUrl?: string | null;

  // Primary Contact & Representative
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string | null;
  contactWhatsApp?: string | null;
  contactLinkedIn?: string | null;

  // Commercial Terms (Fixed 15% Share)
  commissionRate: number; // 15.0
  dealBenchmarkBdt: number; // 60,000 BDT
  minGuaranteedBountyBdt: number; // 9,000 BDT
  operatingHub: string; // platform.royalmotionit.com/referrer

  // Remittance Configuration (Bank Transfer or MFS)
  payoutMethod?: "BANK_TRANSFER" | "BKASH" | "NAGAD" | "ROCKET" | string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branchDistrict?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  swiftCode?: string | null;
  walletNumber?: string | null;

  // Lifecycle & Status
  status: ReferrerStatus;
  statusReason?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;

  // Contract Information
  contractKey?: string | null;
  contractFileName?: string | null;
  contractFileSize?: number | null;
  contractUploadedAt?: string | null;
  contractUploadedBy?: string | null;
  contractUrl?: string | null;

  // Additional Meta & Dossier
  onboardingDetails?: Record<string, any> | null;
  adminNotes?: string | null;

  // User and Relations
  userId: string;
  user?: {
    id: string;
    code?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };

  documents?: ReferrerDocument[];
  deals?: ReferrerDeal[];

  createdAt: string;
  updatedAt: string;
}
