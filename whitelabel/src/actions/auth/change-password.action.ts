"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "No active session found.",
      };
    }

    const res = await api.patch("/whitelabel/auth/password", input, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to change password.",
      };
    }

    return {
      success: true,
      message: res.data.message || "Password changed successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        message:
          error.response.data?.message || "Failed to change password.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred while changing password.",
    };
  }
}
