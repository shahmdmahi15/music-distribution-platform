export interface WhiteLabelMonthlyReport {
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
  notes?: string | null;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsSummaryMetrics {
  totalRevenueBdt: number;
  totalRevenueUsd: number;
  totalStreams: string;
  reportCount: number;
}

// ==========================================
// Revelator-Parity Royalty Statements Types
// ==========================================

export type StatementPaymentStatus = 'PAID' | 'PENDING' | 'PROCESSING';

export interface RoyaltyStatement {
  id: string;
  code: string;
  period: string; // e.g. "2026-09"
  totalStreams: number;
  totalDownloads: number;
  grossRevenueUsd: number;
  netRevenueUsd: number;
  netRevenueBdt: number;
  exchangeRateBdtUsd: number;
  paidStatus: StatementPaymentStatus;
  paidAt?: string | null;
  fileName?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface RoyaltyStatementsSummary {
  netUsd: number;
  netBdt: number;
  totalStreams: number;
  totalDownloads: number;
}
