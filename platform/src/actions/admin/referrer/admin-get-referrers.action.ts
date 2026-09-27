"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Referrer } from "@/types/referrer";

export interface AdminReferrersResponse {
  success: boolean;
  message: string;
  items: Referrer[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    total: number;
    pending: number;
    underReview: number;
    active: number;
    suspended: number;
    rejected: number;
  };
}

export async function adminGetReferrersAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payoutMethod?: string;
  sortBy?: string;
}): Promise<AdminReferrersResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found.",
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        counts: {
          total: 0,
          pending: 0,
          underReview: 0,
          active: 0,
          suspended: 0,
          rejected: 0,
        },
      };
    }

    const res = await api.get("/platform/admin/referrers", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message || "Failed to fetch referrers.",
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        counts: {
          total: 0,
          pending: 0,
          underReview: 0,
          active: 0,
          suspended: 0,
          rejected: 0,
        },
      };
    }

    return {
      success: true,
      message: "Referrers retrieved successfully.",
      items: res.data.items || [],
      pagination: {
        total: res.data.total || 0,
        page: res.data.page || 1,
        limit: res.data.limit || 20,
        totalPages: res.data.totalPages || 1,
      },
      counts: res.data.counts || {
        total: 0,
        pending: 0,
        underReview: 0,
        active: 0,
        suspended: 0,
        rejected: 0,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetReferrers]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      success: false,
      message: "Failed to fetch referrer partners.",
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      counts: {
        total: 0,
        pending: 0,
        underReview: 0,
        active: 0,
        suspended: 0,
        rejected: 0,
      },
    };
  }
}
