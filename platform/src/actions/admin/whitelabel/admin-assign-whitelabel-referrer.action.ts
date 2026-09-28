"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function adminAssignWhiteLabelReferrerAction(
  whiteLabelId: string,
  referrerId: string | null,
): Promise<{
  success: boolean;
  message: string;
  referrer?: any;
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

    const res = await api.patch(
      `/platform/admin/whitelabels/${whiteLabelId}/referrer`,
      { referrerId },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    revalidatePath("/admin/whitelabels");
    return {
      success: res.data.success,
      message: res.data.message,
      referrer: res.data.referrer,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.AssignWhiteLabelReferrer]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to assign referrer partner.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred while assigning referrer.",
    };
  }
}
