"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

export async function adminDeletePlatformUserAction(id: string) {
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

    const res = await api.delete(`/platform/admin/platform-users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to delete platform user.",
      };
    }

    revalidatePath("/admin/users/platform");

    return {
      success: true,
      message: res.data.message || "Platform user deleted successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.DeleteUser]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.DeleteUser]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
