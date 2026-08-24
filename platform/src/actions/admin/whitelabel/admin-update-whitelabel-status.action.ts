"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

import { revalidatePath } from "next/cache";

export async function adminUpdateWhiteLabelStatusAction(
  id: string,
  payload: {
    status: string;
    statusReason?: string;
  },
): Promise<{
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

    const res = await api.patch(`/platform/admin/whitelabels/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    return {
      success: res.data.success,
      message: res.data.message,
      whiteLabel: res.data.whiteLabel,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.UpdateWhiteLabelStatus]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update status.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
