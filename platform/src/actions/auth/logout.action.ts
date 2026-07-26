"use server";

import { api } from "@/lib/api";
import { cookies } from "next/headers";
import axios from "axios";

export async function logoutAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.post(
      "/platform/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    cookieStore.delete("__Host-SESSION_TOKEN");

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Auth.Me]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.Logout]: ", { error });
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
