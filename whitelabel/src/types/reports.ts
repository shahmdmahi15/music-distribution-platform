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
