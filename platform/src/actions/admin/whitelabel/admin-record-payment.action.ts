"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

import { revalidatePath } from "next/cache";

export async function adminRecordPaymentAction(
  id: string,
  payload: {
    amount: number;
    discount?: number;
    startsAt: string;
    endsAt: string;
    status?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  payment?: any;
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

    const res = await api.post(
      `/platform/admin/whitelabels/${id}/record-payment`,
      payload,
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
    revalidatePath("/");
    return {
      success: res.data.success,
      message: res.data.message,
      payment: res.data.payment,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.RecordPayment]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message: error.response?.data?.message || "Failed to record payment.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
