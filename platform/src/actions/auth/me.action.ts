"use server";

import { api } from "@/lib/api";
import { cookies } from "next/headers";
import axios from "axios";
import { User } from "@/types/user";

export async function meAction(sessionToken?: string): Promise<{
  success: boolean;
  message: string;
  user?: User;
}> {
  try {
    const cookieStore = await cookies();

    const token =
      sessionToken ?? cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.get("/platform/auth/me", {
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
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Auth.Me]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.Me]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
