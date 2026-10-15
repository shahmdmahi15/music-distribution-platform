"use server";

import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { Release, ReleaseStatus, Track } from "@/types/catalog";
import axios from "axios";

async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get(WL_SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function wlGetUploadUrlAction(data: {
  type: "AUDIO" | "COVER_ART";
  fileName: string;
  mimeType: string;
}): Promise<{
  success: boolean;
  message: string;
  uploadUrl?: string;
  key?: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/catalog/upload-url", data, {
      headers,
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

export async function wlCreateReleaseAction(data: any): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post("/whitelabel/catalog/releases", data, {
      headers,
    });
    return {
      success: true,
      message: "Release draft created successfully.",
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

export async function wlGetReleasesAction(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReleaseStatus;
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
    const headers = await getAuthHeader();
    const res = await api.get("/whitelabel/catalog/releases", {
      headers,
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

export async function wlGetReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get(`/whitelabel/catalog/releases/${code}`, {
      headers,
    });
    return {
      success: true,
      message: "Release retrieved successfully.",
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

export async function wlUpdateReleaseAction(
  code: string,
  data: any,
): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.put(`/whitelabel/catalog/releases/${code}`, data, {
      headers,
    });
    return {
      success: true,
      message: "Release updated successfully.",
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

export async function wlSubmitReleaseAction(code: string): Promise<{
  success: boolean;
  message: string;
  release?: Release;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post(
      `/whitelabel/catalog/releases/${code}/submit`,
      {},
      { headers },
    );
    return {
      success: true,
      message: res.data.message || "Release submitted successfully.",
      release: res.data.release,
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

export async function wlAddTrackAction(
  releaseCode: string,
  data: any,
): Promise<{
  success: boolean;
  message: string;
  track?: Track;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.post(
      `/whitelabel/catalog/releases/${releaseCode}/tracks`,
      data,
      { headers },
    );
    return {
      success: true,
      message: "Track added successfully.",
      track: res.data,
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

export async function wlDeleteTrackAction(
  releaseCode: string,
  trackCode: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.delete(
      `/whitelabel/catalog/releases/${releaseCode}/tracks/${trackCode}`,
      { headers },
    );
    return {
      success: true,
      message: res.data.message || "Track removed.",
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

export async function wlGetAudioStreamUrlAction(trackCode: string): Promise<{
  success: boolean;
  message: string;
  streamUrl?: string;
  title?: string;
}> {
  try {
    const headers = await getAuthHeader();
    const res = await api.get(
      `/whitelabel/catalog/tracks/${trackCode}/stream`,
      { headers },
    );
    return {
      success: true,
      message: "Stream URL generated.",
      streamUrl: res.data.streamUrl,
      title: res.data.title,
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
