"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export async function adminDeleteReferrerDocumentAction(docId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.delete(`/platform/admin/referrers/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Document deleted successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to delete document.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
