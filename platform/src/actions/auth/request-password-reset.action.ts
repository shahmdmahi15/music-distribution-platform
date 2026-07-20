"use server";

import { z } from "zod";
import {
  RequestPasswordResetError,
  RequestPasswordResetInput,
  requestPasswordResetSchema,
} from "@/schemas/auth/request-password-reset.schema";
import { api } from "@/lib/api";

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<{
  success: boolean;
  message: string;
  error?: RequestPasswordResetError;
}> {
  try {
    const validate = await requestPasswordResetSchema.safeParseAsync(input);

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

    const res = await api.post("/platform/auth/request-password-reset", body);

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
    console.error("[Action.Auth.RequestPasswordReset]: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
