"use server";

import { z } from "zod";
import axios from "axios";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";
import {
  AdminResetPasswordPlatformUserInput,
  adminResetPasswordPlatformUserSchema,
} from "@/schemas/admin/users/platform/admin-reset-password-platform-user.schema";

export async function adminResetPasswordPlatformUserAction(
  id: string,
  input: AdminResetPasswordPlatformUserInput,
) {
  try {
    if (!id) {
      return {
        success: false,
        message: "User ID is required.",
      };
    }

    const validate =
      await adminResetPasswordPlatformUserSchema.safeParseAsync(input);

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

    const res = await api.post(
      `/platform/admin/platform-users/${id}/reset-password`,
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
        message: res.data.message || "Failed to reset password.",
      };
    }

    revalidatePath("/admin/users/platform");

    return {
      success: true,
      message: res.data.message || "Password reset successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Users.Platform.ResetPassword]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Users.Platform.ResetPassword]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
