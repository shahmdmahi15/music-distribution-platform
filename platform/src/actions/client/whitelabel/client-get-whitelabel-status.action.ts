"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WhiteLabel } from "@/types/whitelabel";
import { SubscriptionPayment } from "@/types/subscription";

export async function clientGetWhiteLabelStatusAction(): Promise<{
  success: boolean;
  message: string;
  hasApplication?: boolean;
  whiteLabel?: WhiteLabel | null;
  payments?: SubscriptionPayment[];
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

    const res = await api.get("/platform/client/whitelabel/status", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      hasApplication: res.data.hasApplication,
      whiteLabel: res.data.whiteLabel,
      payments: res.data.payments,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.GetWhiteLabelStatus]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      success: false,
      message: "Failed to fetch application status.",
    };
  }
}
