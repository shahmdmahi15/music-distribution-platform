"use server";

import { z } from "zod";
import {
  ResendVerificationError,
  ResendVerificationInput,
  resendVerificationSchema,
} from "@/schemas/auth/resend-verification.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function resendVerificationAction(
  input: ResendVerificationInput,
): Promise<{
  success: boolean;
  message: string;
  error?: ResendVerificationError;
}> {
  try {
    const validate = await resendVerificationSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body = {
      email: validate.data.email,
    };

    const res = await api.post("/platform/auth/resend-verification", body);

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Auth.Me]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.ResendVerification]: ", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
