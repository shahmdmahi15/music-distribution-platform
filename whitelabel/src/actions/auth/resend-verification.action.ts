"use server";

import { api } from "@/lib/api";
import axios from "axios";

export async function resendVerificationAction(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!email || !email.trim()) {
    return {
      success: false,
      message: "Email address is required.",
    };
  }

  try {
    const res = await api.post("/whitelabel/auth/resend-verification", {
      email,
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to resend verification.",
      };
    }

    return {
      success: true,
      message:
        res.data.message ||
        "If the email is registered, a verification link has been sent.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to resend verification link.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
