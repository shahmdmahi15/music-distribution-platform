"use server";

import { api } from "@/lib/api";
import axios from "axios";

export async function verifyAction(token: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!token || !token.trim()) {
    return {
      success: false,
      message: "Verification token is required.",
    };
  }

  try {
    const res = await api.post("/whitelabel/auth/verify", { token });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to verify email.",
      };
    }

    return {
      success: true,
      message: res.data.message || "Email verified successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Invalid or expired token.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
