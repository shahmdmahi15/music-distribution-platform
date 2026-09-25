"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";
import { WhiteLabelUser, WhiteLabelTenant } from "@/types/user";

export async function meAction(sessionToken?: string): Promise<{
  success: boolean;
  message: string;
  user?: WhiteLabelUser;
  tenant?: WhiteLabelTenant;
}> {
  try {
    let token = sessionToken;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(WL_SESSION_COOKIE)?.value;
      } catch {
        // cookies() from next/headers is not supported in proxy/middleware runtime
      }
    }

    if (!token) {
      return {
        success: false,
        message: "No active session found.",
      };
    }

    const res = await api.get("/whitelabel/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to retrieve user profile.",
      };
    }

    return {
      success: true,
      message: res.data.message,
      user: res.data.user,
      tenant: res.data.tenant,
    };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      console.error("[Whitelabel.MeAction]:", error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || "Session invalid or expired.",
      };
    }
    console.error("[Whitelabel.MeAction]:", error);
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
