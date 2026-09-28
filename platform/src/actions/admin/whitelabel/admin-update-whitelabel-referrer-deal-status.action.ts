"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function adminUpdateWhiteLabelReferrerDealStatusAction(
  whiteLabelId: string,
  dealId: string,
  status: string,
): Promise<{
  success: boolean;
  message: string;
  deal?: any;
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
      `/platform/admin/whitelabels/${whiteLabelId}/referrer-deal/${dealId}/status`,
      { status },
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
    revalidatePath("/admin/referrers");
    return {
      success: res.data.success,
      message: res.data.message,
      deal: res.data.deal,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.UpdateWhiteLabelReferrerDealStatus]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to update referrer deal status.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred while updating deal status.",
    };
  }
}
