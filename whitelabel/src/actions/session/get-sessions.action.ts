"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";
import { SessionItem } from "@/types/user";

export async function getSessionsAction(): Promise<{
  success: boolean;
  message: string;
  sessions?: SessionItem[];
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

    const res = await api.get("/whitelabel/session/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to fetch sessions.",
      };
    }

    return {
      success: true,
      message: res.data.message,
      sessions: res.data.sessions,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch sessions.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
