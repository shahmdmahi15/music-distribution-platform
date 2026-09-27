"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Referrer, ReferrerStatus } from "@/types/referrer";

export interface ClientReferrerStatusResponse {
  hasApplied: boolean;
  status: ReferrerStatus | null;
  code?: string;
  referralCode?: string;
  name?: string;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  statusReason?: string | null;
  contractUrl?: string | null;
  payoutMethod?: string;
  commissionRate?: number;
  dealBenchmarkBdt?: number;
  minGuaranteedBountyBdt?: number;
  operatingHub?: string;
  referrer?: Referrer | null;
}

export async function clientGetReferrerStatusAction(): Promise<ClientReferrerStatusResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        hasApplied: false,
        status: null,
        referrer: null,
      };
    }

    const res = await api.get("/platform/client/referrer/status", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      hasApplied: res.data.hasApplied ?? false,
      status: res.data.status ?? null,
      code: res.data.code,
      referralCode: res.data.referralCode,
      name: res.data.name,
      approvedAt: res.data.approvedAt,
      reviewedAt: res.data.reviewedAt,
      statusReason: res.data.statusReason,
      contractUrl: res.data.contractUrl,
      payoutMethod: res.data.payoutMethod,
      commissionRate: res.data.commissionRate ?? 15,
      dealBenchmarkBdt: res.data.dealBenchmarkBdt ?? 60000,
      minGuaranteedBountyBdt: res.data.minGuaranteedBountyBdt ?? 9000,
      operatingHub: res.data.operatingHub || "platform.royalmotionit.com/referrer",
      referrer: res.data.referrer || null,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.GetReferrerStatus]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return {
      hasApplied: false,
      status: null,
      referrer: null,
    };
  }
}
