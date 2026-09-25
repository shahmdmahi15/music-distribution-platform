"use server";

import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function passwordResetAction(input: ResetPasswordInput): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const validate = await resetPasswordSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const res = await api.post(
      "/whitelabel/auth/password-reset",
      validate.data,
    );

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to reset password.",
      };
    }

    return {
      success: true,
      message: res.data.message || "Password updated successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
