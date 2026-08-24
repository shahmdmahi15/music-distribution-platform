"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function adminBulkDeletePlatformUsersAction(userIds: string[]) {
  try {
    if (!userIds || userIds.length === 0) {
      return {
        success: false,
        message: "No user IDs provided.",
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

    const res = await api.post(
      "/platform/admin/platform-users/bulk/delete",
      { userIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to bulk delete platform users.",
      };
    }

    revalidatePath("/admin/users/platform");

    return {
      success: true,
      message: res.data.message || "Platform users deleted successfully.",
      affectedCount: res.data.affectedCount,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.BulkDelete]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.BulkDelete]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
