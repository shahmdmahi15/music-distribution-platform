"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import { Release, ReleaseStatus, VevoChannel } from "@/types/distribution";
import axios from "axios";

export interface ClientCatalogQuery {
  search?: string;
  status?: ReleaseStatus | "ALL";
  page?: number;
  limit?: number;
}

export async function clientGetCatalogReleasesAction(params?: ClientCatalogQuery): Promise<{
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

    let res: any;
    try {
      res = await api.get("/platform/client/whitelabel/catalog/releases", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: params?.search,
          status: params?.status === "ALL" ? undefined : params?.status,
          page: params?.page || 1,
          limit: params?.limit || 50,
        },
      });
    } catch {
      res = await api.get("/platform/admin/distribution/releases", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search: params?.search,
          status: params?.status === "ALL" ? undefined : params?.status,
          page: params?.page || 1,
          limit: params?.limit || 50,
        },
      });
    }

    const rawList = res.data?.items || res.data?.data || res.data?.releases || res.data || [];
    return {
      success: true,
      message: "Releases retrieved successfully.",
      data: Array.isArray(rawList) ? rawList : [],
      meta: {
        total: res.data?.total || rawList.length,
        page: res.data?.page || 1,
        limit: res.data?.limit || 50,
        totalPages: res.data?.totalPages || 1,
      },
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

export async function clientGetReleaseDossierAction(code: string): Promise<{
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

    let res: any;
    try {
      res = await api.get(`/platform/client/whitelabel/catalog/releases/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      res = await api.get(`/platform/admin/distribution/releases/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return {
      success: true,
      message: "Release dossier loaded.",
      release: res.data?.release || res.data,
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

export async function clientApproveReleaseAction(
  code: string,
  notes?: string,
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

    let res: any;
    try {
      res = await api.post(
        `/platform/client/whitelabel/catalog/releases/${code}/approve`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      res = await api.patch(
        `/platform/admin/distribution/releases/${code}/status`,
        { status: "APPROVED", adminNotes: notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }

    revalidatePath("/whitelabel/catalog");
    revalidatePath("/admin/distribution");
    return {
      success: true,
      message: "Release approved and forwarded to Mother Company for DSP distribution!",
      release: res.data?.release || res.data,
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

export async function clientRequestReleaseFixAction(
  code: string,
  feedback: string,
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

    let res: any;
    try {
      res = await api.post(
        `/platform/client/whitelabel/catalog/releases/${code}/reject`,
        { reason: feedback },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      res = await api.patch(
        `/platform/admin/distribution/releases/${code}/status`,
        { status: "NEEDS_FIX", rejectionReason: feedback },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }

    revalidatePath("/whitelabel/catalog");
    revalidatePath("/admin/distribution");
    return {
      success: true,
      message: "Release sent back to artist with revision feedback notes.",
      release: res.data?.release || res.data,
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

export async function clientGetVevoChannelsAction(): Promise<{
  success: boolean;
  message: string;
  channels: VevoChannel[];
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found.", channels: [] };
    }

    let res: any;
    try {
      res = await api.get("/platform/client/whitelabel/catalog/channels", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      res = await api.get("/platform/admin/distribution/channels", {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    const channels = res.data?.channels || res.data || [];
    return {
      success: true,
      message: "VEVO channel requests retrieved.",
      channels: Array.isArray(channels) ? channels : [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        channels: [],
      };
    }
    return { success: false, message: (error as Error).message, channels: [] };
  }
}

export async function clientApproveVevoChannelAction(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    let res: any;
    try {
      res = await api.post(
        `/platform/client/whitelabel/catalog/channels/${code}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      res = await api.post(
        `/platform/admin/distribution/channels/${code}/ans-dispatch`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    }

    revalidatePath("/whitelabel/channels");
    revalidatePath("/admin/channels");
    return {
      success: true,
      message: res.data?.message || "VEVO channel request approved and forwarded to Mother Company!",
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

export async function clientRejectVevoChannelAction(
  code: string,
  reason: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post(
      `/platform/client/whitelabel/catalog/channels/${code}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    revalidatePath("/whitelabel/channels");
    return {
      success: true,
      message: res.data?.message || "Channel request rejected.",
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
