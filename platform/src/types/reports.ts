export type DistributionReportStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface DistributionReport {
  id: string;
  code: string;
  title: string;
  reportingPeriod: string;
  totalRevenueBdt?: number | null;
  totalRevenueUsd?: number | null;
  totalStreams?: string | number | null;
  fileKey: string;
  fileName: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  status: DistributionReportStatus;
  notes?: string | null;
  publishedAt: string;
  whiteLabelId: string;
  whiteLabel?: {
    id: string;
    code: string;
    name: string;
    subdomain?: string;
  };
  uploadedByPlatformUserId?: string | null;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Platform Royalty Run & DSP Sales Ingestion
// ==========================================

export type RoyaltyRunStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface RoyaltyRun {
  id: string;
  code: string;
  reportingPeriod: string; // YYYY-MM
  store: string; // Spotify, Apple Music, YouTube Music, ALL
  exchangeRateBdtUsd: number; // default 120.0
  totalGrossUsd: number;
  totalPayoutsUsd: number;
  totalPayoutsBdt: number;
  status: RoyaltyRunStatus;
  whiteLabelId?: string | null;
  whiteLabelName?: string | null;
  processedRowsCount?: number;
  executedBy?: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface DspSalesReportUpload {
  store: 'Spotify' | 'Apple Music' | 'YouTube Music' | 'Amazon Music' | 'TikTok' | 'Deezer';
  reportingPeriod: string; // YYYY-MM
  whiteLabelId?: string;
  fileName: string;
  fileSizeBytes: number;
}
