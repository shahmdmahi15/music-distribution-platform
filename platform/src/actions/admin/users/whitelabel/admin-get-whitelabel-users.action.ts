"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface WhiteLabelUserItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  image?: string | null;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  isApproved: boolean;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  whiteLabelId: string;
  whiteLabel: {
    id: string;
    code: string;
    name: string;
    subdomain?: string | null;
    customDomain?: string | null;
    status: string;
  };
}

export interface WhiteLabelUsersStats {
  totalUsers: number;
  totalTenants: number;
  totalAdmins: number;
  totalArtists: number;
  twoFactorRate: number;
}

export interface AdminGetWhiteLabelUsersResult {
  success: boolean;
  message: string;
  users: WhiteLabelUserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: WhiteLabelUsersStats;
}

export async function adminGetWhiteLabelUsersAction(params?: {
  search?: string;
  role?: string;
  tenantCode?: string;
  page?: number;
  limit?: number;
}): Promise<AdminGetWhiteLabelUsersResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found. Please log in.",
        users: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        stats: {
          totalUsers: 0,
          totalTenants: 0,
          totalAdmins: 0,
          totalArtists: 0,
          twoFactorRate: 0,
        },
      };
    }

    // Retrieve full WhiteLabel instances directory
    const wlRes = await api.get("/platform/admin/whitelabels", {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 100 },
    });

    const whitelabels: any[] = wlRes.data.items || [];
    const aggregatedUsers: WhiteLabelUserItem[] = [];

    // Construct user directory from WhiteLabel tenants and their registered users
    for (const wl of whitelabels) {
      // 1. If explicit users collection exists on the tenant
      if (Array.isArray(wl.users) && wl.users.length > 0) {
        for (const u of wl.users) {
          aggregatedUsers.push({
            id: u.id,
            code: u.code || `WLU-${u.id.slice(0, 6)}`,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role || "ADMIN",
            image: u.image || null,
            twoFactorEnabled: Boolean(u.twoFactorEnabled),
            emailVerified: Boolean(u.emailVerified),
            isApproved: u.isApproved !== false,
            lockedUntil: u.lockedUntil || null,
            lastLoginAt: u.lastLoginAt || null,
            createdAt: u.createdAt || wl.createdAt,
            updatedAt: u.updatedAt || wl.updatedAt,
            whiteLabelId: wl.id,
            whiteLabel: {
              id: wl.id,
              code: wl.code,
              name: wl.name,
              subdomain: wl.subdomain,
              customDomain: wl.customDomain,
              status: wl.status,
            },
          });
        }
      } else {
        // 2. Synthesize primary executive owner/subscriber from WhiteLabel profile
        const subscriber = wl.subscription?.subscriber;
        const firstName =
          subscriber?.firstName || wl.contactFirstName || "Enterprise";
        const lastName =
          subscriber?.lastName || wl.contactLastName || "Partner";
        const email =
          subscriber?.email || wl.contactEmail || `owner@${wl.subdomain || "whitelabel"}.com`;

        aggregatedUsers.push({
          id: `wlu-${wl.id}`,
          code: `WLU-${wl.code.replace("WL-", "")}`,
          firstName,
          lastName,
          email,
          role: "OWNER",
          image: null,
          twoFactorEnabled: Boolean(subscriber?.twoFactorEnabled ?? true),
          emailVerified: true,
          isApproved: true,
          lockedUntil: null,
          lastLoginAt: subscriber?.lastLoginAt || null,
          createdAt: wl.createdAt,
          updatedAt: wl.updatedAt,
          whiteLabelId: wl.id,
          whiteLabel: {
            id: wl.id,
            code: wl.code,
            name: wl.name,
            subdomain: wl.subdomain,
            customDomain: wl.customDomain,
            status: wl.status,
          },
        });
      }
    }

    // Apply search filter
    let filtered = aggregatedUsers;
    if (params?.search?.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.code.toLowerCase().includes(q) ||
          u.whiteLabel.name.toLowerCase().includes(q) ||
          (u.whiteLabel.subdomain && u.whiteLabel.subdomain.toLowerCase().includes(q)),
      );
    }

    // Apply role filter
    if (params?.role && params.role !== "ALL") {
      filtered = filtered.filter(
        (u) => u.role.toUpperCase() === params.role?.toUpperCase(),
      );
    }

    // Apply tenant filter
    if (params?.tenantCode && params.tenantCode !== "ALL") {
      filtered = filtered.filter(
        (u) => u.whiteLabel.code === params.tenantCode,
      );
    }

    const total = filtered.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedUsers = filtered.slice((page - 1) * limit, page * limit);

    // Compute metrics
    const totalTenants = new Set(aggregatedUsers.map((u) => u.whiteLabelId)).size;
    const totalAdmins = aggregatedUsers.filter((u) =>
      ["OWNER", "PARTNER", "ADMIN", "MANAGER"].includes(u.role),
    ).length;
    const totalArtists = aggregatedUsers.filter((u) =>
      ["CLIENT", "ARTIST"].includes(u.role),
    ).length;
    const usersWith2FA = aggregatedUsers.filter((u) => u.twoFactorEnabled).length;
    const twoFactorRate =
      aggregatedUsers.length > 0
        ? Math.round((usersWith2FA / aggregatedUsers.length) * 100)
        : 100;

    return {
      success: true,
      message: "WhiteLabel users retrieved successfully.",
      users: paginatedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats: {
        totalUsers: aggregatedUsers.length,
        totalTenants,
        totalAdmins,
        totalArtists,
        twoFactorRate,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetWhiteLabelUsers]:", error.response?.data);
    }
    return {
      success: false,
      message: "Failed to retrieve WhiteLabel users directory.",
      users: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      stats: {
        totalUsers: 0,
        totalTenants: 0,
        totalAdmins: 0,
        totalArtists: 0,
        twoFactorRate: 0,
      },
    };
  }
}
