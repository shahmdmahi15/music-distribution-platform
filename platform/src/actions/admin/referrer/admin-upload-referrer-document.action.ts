"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { ReferrerDocument } from "@/types/referrer";

export async function adminUploadReferrerDocumentAction(
  referrerId: string,
  formData: FormData,
): Promise<{
  success: boolean;
  message: string;
  document?: ReferrerDocument;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post(`/platform/admin/referrers/${referrerId}/documents`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Document uploaded successfully.",
      document: res.data.document,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to upload document.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
