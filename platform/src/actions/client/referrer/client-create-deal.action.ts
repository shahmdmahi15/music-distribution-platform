"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { ReferrerDeal } from "@/types/referrer";

export interface ClientCreateDealPayload {
  clientName: string;
  clientEmail?: string;
  contactName?: string;
  contactPhone?: string;
  sellingPriceBdt?: number;
  notes?: string;
}

export async function clientCreateDealAction(
  payload: ClientCreateDealPayload,
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

    const res = await api.post("/platform/client/referrer/deals", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Deal registered successfully.",
      deal: res.data.deal,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to register client deal.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
