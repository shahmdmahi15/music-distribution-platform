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
