"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WhiteLabel } from "@/types/whitelabel";

export async function adminGetWhiteLabelDetailsAction(id: string): Promise<{
  success: boolean;
  message: string;
  whiteLabel?: any;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found.",
      };
    }

    const res = await api.get(`/platform/admin/whitelabels/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    return {
      success: res.data.success,
      message: res.data.message,
      whiteLabel: res.data.whiteLabel,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.GetWhiteLabelDetails]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      success: false,
      message: "Failed to fetch WhiteLabel details.",
    };
  }
}
