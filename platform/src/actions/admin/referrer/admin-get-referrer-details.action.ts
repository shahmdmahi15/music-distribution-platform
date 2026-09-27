"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Referrer } from "@/types/referrer";

export async function adminGetReferrerDetailsAction(id: string): Promise<{
  success: boolean;
  message?: string;
  referrer?: Referrer;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.get(`/platform/admin/referrers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message,
      referrer: res.data.referrer,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetReferrerDetails]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to load referrer details.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
