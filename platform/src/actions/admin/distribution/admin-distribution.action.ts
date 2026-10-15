"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Release, ReleaseStatus } from "@/types/distribution";
import axios from "axios";

export async function adminGetDistributionReleasesAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReleaseStatus;
  whiteLabelId?: string;
}): Promise<{
  success: boolean;
  message: string;
  data: Release[];
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

    const res = await api.get("/platform/admin/distribution/releases", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    return {
      success: true,
      message: "Releases retrieved successfully.",
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

export async function adminGetReleaseDossierAction(code: string): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.get(`/platform/admin/distribution/releases/${code}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: true,
      message: "Release dossier loaded.",
      release: res.data,
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

export async function adminUpdateReleaseStatusAction(
  code: string,
  data: {
    status: ReleaseStatus;
    rejectionReason?: string;
    adminNotes?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.patch(
      `/platform/admin/distribution/releases/${code}/status`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return {
      success: true,
      message: `Release status updated to ${data.status}.`,
      release: res.data,
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

export async function adminExportReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  bundle?: any;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.get(
      `/platform/admin/distribution/releases/${code}/export`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return {
      success: true,
      message: "Export manifest generated successfully.",
      bundle: res.data,
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

export async function adminRescanTrackAction(trackCode: string): Promise<{
  success: boolean;
  message: string;
  scan?: any;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post(
      `/platform/admin/distribution/tracks/${trackCode}/scan`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return {
      success: true,
      message: "ACRCloud fingerprint scan completed.",
      scan: res.data.scan,
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

