"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Referrer } from "@/types/referrer";

export interface ClientApplyReferrerPayload {
  name: string;
  referralCode?: string;
  companyWebsite?: string;
  country: string;
  yearsInBusiness?: number;
  isIncorporated?: boolean;
  incorporationDocUrl?: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsApp: string;
  contactLinkedIn?: string;
  payoutMethod: string; // 'BANK_TRANSFER' | 'BKASH' | 'NAGAD' | 'ROCKET'
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchDistrict?: string;
  branchName?: string;
  routingNumber?: string;
  swiftCode?: string;
  walletNumber?: string;
  onboardingDetails?: Record<string, any>;
}

export async function clientApplyReferrerAction(
  payload: ClientApplyReferrerPayload,
): Promise<{
  success: boolean;
  message: string;
  referrer?: Referrer;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post("/platform/client/referrer/apply", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Referrer application submitted successfully.",
      referrer: res.data.referrer,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to submit referrer application.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
