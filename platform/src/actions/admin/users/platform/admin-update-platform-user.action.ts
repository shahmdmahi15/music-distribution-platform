"use server";

import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import {
  AdminPartialUpdatePlatformUserInput,
  adminPartialUpdatePlatformUserSchema,
} from "@/schemas/admin/users/platform/admin-update-platform-user.schema";

export async function adminUpdatePlatformUserAction(
  id: string,
  input: AdminPartialUpdatePlatformUserInput,
) {
  try {
    if (!id) {
      return {
        success: false,
        message: "User ID is required.",
      };
    }

    const validate =
      await adminPartialUpdatePlatformUserSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
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

    const res = await api.patch(
      `/platform/admin/platform-users/${id}`,
      validate.data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to update platform user.",
      };
    }

    revalidatePath("/admin/users/platform");

    return {
      success: true,
      message: res.data.message || "Platform user updated successfully.",
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.UpdateUser]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.UpdateUser]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
