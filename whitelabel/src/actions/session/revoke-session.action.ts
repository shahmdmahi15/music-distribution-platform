"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export async function revokeSessionAction(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    const res = await api.post(
      `/whitelabel/session/${code}/revoke`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: true,
      message: res.data.message || "Session revoked.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to revoke session.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}

export async function revokeOtherSessionsAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    const res = await api.post(
      `/whitelabel/session/revoke-others`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: true,
      message: res.data.message || "Other sessions revoked.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to revoke other sessions.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
