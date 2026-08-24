export interface Session {
  id: string;
  code?: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  revokeReason: string | null;
  platformUserId: string | null;
  accessedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}
