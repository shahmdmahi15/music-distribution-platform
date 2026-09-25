"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export interface CheckSubdomainResult {
  success: boolean;
  available: boolean;
  subdomain: string;
  reason?: string;
  fqdn: string;
}

export async function clientCheckSubdomainAction(
  subdomain: string,
): Promise<CheckSubdomainResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        available: false,
        subdomain,
        reason: "Session token not found. Please log in.",
        fqdn: "",
      };
    }

    const res = await api.get("/platform/client/whitelabel/subdomain/check", {
      params: { subdomain },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      available: Boolean(res.data?.available),
      subdomain: res.data?.subdomain || subdomain,
      reason: res.data?.reason,
      fqdn: res.data?.fqdn || `${subdomain}.platform.royalmotionit.com`,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        available: false,
        subdomain,
        reason:
          error.response?.data?.message ||
          "Failed to check subdomain availability.",
        fqdn: "",
      };
    }
    return {
      success: false,
      available: false,
      subdomain,
      reason: "An unexpected error occurred checking subdomain.",
      fqdn: "",
    };
  }
}
