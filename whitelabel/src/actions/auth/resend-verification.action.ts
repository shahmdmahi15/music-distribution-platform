"use server";

import { api } from "@/lib/api";
import axios from "axios";
import { resendVerificationSchema, ResendVerificationInput } from "@/schemas/auth.schema";

export async function resendVerificationAction(
  input: string | ResendVerificationInput
): Promise<{
  success: boolean;
  message: string;
}> {
  const rawEmail = typeof input === "string" ? input : input?.email;
  const validation = resendVerificationSchema.safeParse({ email: rawEmail });

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "A valid email address is required.",
    };
  }

  const email = validation.data.email.trim().toLowerCase();

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
      message: "An unexpected error occurred while sending verification email.",
    };
  }
}
