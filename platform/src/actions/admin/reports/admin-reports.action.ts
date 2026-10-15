"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { DistributionReport } from "@/types/reports";
import axios from "axios";

export async function adminGetReportUploadUrlAction(data: {
  whiteLabelId: string;
  reportingPeriod: string;
  fileName: string;
  mimeType: string;
}): Promise<{
  success: boolean;
  message: string;
  uploadUrl?: string;
  key?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post("/platform/admin/reports/upload-url", data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      message: "Upload URL generated.",
      uploadUrl: res.data.uploadUrl,
      key: res.data.key,
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

export async function adminCreateDistributionReportAction(data: {
  whiteLabelId: string;
  title: string;
  reportingPeriod: string;
  totalRevenueBdt?: number;
  totalRevenueUsd?: number;
  totalStreams?: number;
  fileKey: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message: string;
  report?: DistributionReport;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post("/platform/admin/reports", data, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      message: "Monthly distribution report published successfully.",
      report: res.data,
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

export async function adminGetDistributionReportsAction(params?: {
  page?: number;
  limit?: number;
  whiteLabelId?: string;
  reportingPeriod?: string;
  search?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: DistributionReport[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found.",
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    }

    const res = await api.get("/platform/admin/reports", {
      headers: { Authorization: `Bearer ${token}` },
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

export async function adminGetReportDownloadUrlAction(code: string): Promise<{
  success: boolean;
  message: string;
  downloadUrl?: string;
  fileName?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.get(`/platform/admin/reports/${code}/download`, {
      headers: { Authorization: `Bearer ${token}` },
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

export async function adminDeleteDistributionReportAction(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.delete(`/platform/admin/reports/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      message: res.data.message || "Report deleted successfully.",
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
