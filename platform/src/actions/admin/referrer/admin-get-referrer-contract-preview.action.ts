"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export async function adminGetReferrerContractPreviewAction(id: string): Promise<{
  success: boolean;
  message?: string;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.get(`/platform/admin/referrers/${id}/contract/preview`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message,
      previewUrl: res.data.previewUrl,
      fileName: res.data.fileName,
      fileSize: res.data.fileSize,
      uploadedAt: res.data.uploadedAt,
      uploadedBy: res.data.uploadedBy,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to load contract preview.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
