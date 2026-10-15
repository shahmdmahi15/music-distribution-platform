"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import {
  WhiteLabelMonthlyReport,
  ReportsSummaryMetrics,
} from "@/types/reports";
import axios from "axios";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WL_SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function wlGetReportsAction(params?: {
  page?: number;
  limit?: number;
  period?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: WhiteLabelMonthlyReport[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/reports", {
      headers,
      params,
    });
    return {
      success: true,
      message: "Reports retrieved successfully.",
      data: res.data.data || [],
      meta: res.data.meta || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      success: false,
      message: (error as Error).message,
      data: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  }
}

export async function wlGetReportsSummaryAction(): Promise<{
  success: boolean;
  message: string;
  summary?: ReportsSummaryMetrics;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/reports/summary", { headers });
    return {
      success: true,
      message: "Summary retrieved.",
      summary: res.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}

export async function wlGetReportDownloadUrlAction(code: string): Promise<{
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get(`/whitelabel/reports/${code}/download`, {
      headers,
    });
    return {
      success: true,
      message: "Download URL generated.",
      downloadUrl: res.data.downloadUrl,
      fileName: res.data.fileName,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
      };
    }
    return { success: false, message: (error as Error).message };
  }
}
