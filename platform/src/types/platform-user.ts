import { Role } from "./user";

export { Role as PlatformUserRole };

export interface PlatformUserItem {
  id: string;
  code?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  image: string | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  failedVerificationAttempts: number;
  failedPasswordResetAttempts: number;
  failedTwoFactorAttempts: number;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  activeSessionCount: number;
  oauthProviders: string[];
  subscription: {
    id: string;
    code?: string;
    suspendedAt: string | null;
    whiteLabel: { id: string; code?: string; name: string } | null;
  } | null;
}

export interface PlatformUsersStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  verifiedUsers: number;
  twoFactorUsers: number;
  roleCounts: {
    OWNER: number;
    ADMIN: number;
    MANAGER: number;
    STAFF: number;
    CLIENT: number;
  };
}

export interface PlatformUsersPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PlatformUserSession {
  id: string;
  code?: string;
  ipAddress: string | null;
  userAgent: string | null;
  accessedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  createdAt: string;
}

export interface PlatformUserOAuthAccount {
  id: string;
  code?: string;
  provider: string;
  providerId: string;
  createdAt: string;
}

export interface PlatformUserDetail extends PlatformUserItem {
  oAuthAccounts: PlatformUserOAuthAccount[];
  sessions: PlatformUserSession[];
  subscription: {
    id: string;
    code?: string;
    suspendedAt: string | null;
    whiteLabel: { id: string; code?: string; name: string; createdAt: string } | null;
    payments: Array<{
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
}
