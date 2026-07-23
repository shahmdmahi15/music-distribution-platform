"use server";

import { z } from "zod";
import {
  PasswordResetError,
  PasswordResetInput,
  passwordResetSchema,
} from "@/schemas/auth/password-reset.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function passwordResetAction(input: PasswordResetInput): Promise<{
  success: boolean;
  message: string;
  error?: PasswordResetError;
}> {
  try {
    const validate = await passwordResetSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body = {
      token: validate.data.token,
      newPassword: validate.data.password,
    };

    const res = await api.post("/platform/auth/password-reset", body);

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
      console.error("[Action.Auth.PasswordReset]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.PasswordReset]: ", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
