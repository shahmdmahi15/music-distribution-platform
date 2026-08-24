"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import {
  AdminGetPlatformUsersInput,
  adminGetPlatformUsersSchema,
} from "@/schemas/admin/users/platform/admin-get-platform-users.schema";
import {
  PlatformUserItem,
  PlatformUsersPagination,
  PlatformUsersStats,
} from "@/types/platform-user";

export async function adminGetPlatformUsersAction(
  params?: Partial<AdminGetPlatformUsersInput>,
): Promise<{
  success: boolean;
  message: string;
  users?: PlatformUserItem[];
  pagination?: PlatformUsersPagination;
  stats?: PlatformUsersStats;
}> {
  try {
    const parse = await adminGetPlatformUsersSchema.safeParseAsync(params || {});
    const query = parse.success ? parse.data : {};

    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.get("/platform/admin/platform-users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: query,
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to fetch platform users.",
      };
    }

    return {
      success: true,
      message: res.data.message,
      users: res.data.users,
      pagination: res.data.pagination,
      stats: res.data.stats,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.GetUsers]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.GetUsers]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
