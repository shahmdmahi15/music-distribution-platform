"use server";

import { z } from "zod";
import {
  AdminPasswordUpdateInput,
  adminPasswordUpdateSchema,
} from "@/schemas/admin/profile/admin-password-update.schema";
import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function adminPasswordUpdateAction(
  input: AdminPasswordUpdateInput,
) {
  try {
    const validate = await adminPasswordUpdateSchema.safeParseAsync(input);

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

    const body = {
      currentPassword: validate.data.currentPassword,
      newPassword: validate.data.newPassword,
    };

    const res = await api.patch("/platform/admin/profile/password", body, {
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

    revalidatePath("/admin/profile");

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Profile.PasswordUpdate]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Profile.PasswordUpdate]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
