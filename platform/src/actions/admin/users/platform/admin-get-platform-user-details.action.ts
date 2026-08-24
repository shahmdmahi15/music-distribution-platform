"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { PlatformUserDetail } from "@/types/platform-user";

export async function adminGetPlatformUserDetailsAction(id: string): Promise<{
  success: boolean;
  message: string;
  user?: PlatformUserDetail;
}> {
  try {
    if (!id) {
      return {
        success: false,
        message: "User ID is required.",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.get(`/platform/admin/platform-users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to fetch user details.",
      };
    }

    return {
      success: true,
      message: res.data.message,
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.GetUserDetails]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.GetUserDetails]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
