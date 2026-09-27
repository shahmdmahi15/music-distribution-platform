"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { ReferrerDeal } from "@/types/referrer";

export async function adminCreateReferrerDealAction(
  referrerId: string,
  payload: {
    clientName: string;
    clientEmail?: string;
    sellingPriceBdt: number;
    referrerBountyBdt?: number;
    status?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  deal?: ReferrerDeal;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post(`/platform/admin/referrers/${referrerId}/deals`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Deal created successfully.",
      deal: res.data.deal,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create deal.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}

export async function adminUpdateReferrerDealStatusAction(
  dealId: string,
  status: string,
): Promise<{
  success: boolean;
  message: string;
  deal?: ReferrerDeal;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.patch(`/platform/admin/referrers/deals/${dealId}/status`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Deal status updated.",
      deal: res.data.deal,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update deal status.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}

export async function adminDeleteReferrerDealAction(dealId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.delete(`/platform/admin/referrers/deals/${dealId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Deal deleted.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete deal.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
