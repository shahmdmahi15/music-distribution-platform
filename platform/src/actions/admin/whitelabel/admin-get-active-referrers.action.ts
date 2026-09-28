"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { ActiveReferrerOption } from "@/types/whitelabel";

export async function adminGetActiveReferrersAction(): Promise<{
  success: boolean;
  message?: string;
  items: ActiveReferrerOption[];
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found.",
        items: [],
      };
    }

    const res = await api.get("/platform/admin/whitelabels/active-referrers", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
        items: [],
      };
    }

    return {
      success: true,
      items: res.data.items || [],
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetActiveReferrers]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch active referrers.",
        items: [],
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred while fetching active referrers.",
      items: [],
    };
  }
}
