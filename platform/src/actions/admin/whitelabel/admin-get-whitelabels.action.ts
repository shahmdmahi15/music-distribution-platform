"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WhiteLabel } from "@/types/whitelabel";

export interface AdminWhiteLabelsResponse {
  success: boolean;
  message: string;
  items: (WhiteLabel & {
    subscription?: {
      subscriber?: {
        id: string;
        code?: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
      };
      payments?: {
        id: string;
        code?: string;
        amount: number;
        status: string;
        startsAt: string;
        endsAt: string;
      }[];
    };
  })[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: {
    all: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
  };
}

export async function adminGetWhiteLabelsAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  businessType?: string;
  sortBy?: string;
}): Promise<AdminWhiteLabelsResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found.",
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        counts: { all: 0, pending: 0, underReview: 0, approved: 0, rejected: 0 },
      };
    }

    const res = await api.get("/platform/admin/whitelabels", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
        counts: { all: 0, pending: 0, underReview: 0, approved: 0, rejected: 0 },
      };
    }

    return {
      success: res.data.success,
      message: res.data.message,
      items: res.data.items || [],
      pagination: res.data.pagination,
      counts: res.data.counts,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetWhiteLabels]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      success: false,
      message: "Failed to fetch WhiteLabel applications.",
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
      counts: { all: 0, pending: 0, underReview: 0, approved: 0, rejected: 0 },
    };
  }
}
