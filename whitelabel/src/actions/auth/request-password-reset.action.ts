"use server";

import { requestResetSchema, RequestResetInput } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function requestPasswordResetAction(
  input: RequestResetInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const validate = await requestResetSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const res = await api.post(
      "/whitelabel/auth/request-password-reset",
      validate.data,
    );

    return {
      success: true,
      message:
        res.data.message ||
        "If the email is registered, reset instructions have been sent.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to process request.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
