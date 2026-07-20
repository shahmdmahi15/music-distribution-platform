"use server";

import { z } from "zod";
import {
  VerifyError,
  VerifyInput,
  verifySchema,
} from "@/schemas/auth/verify.schema";
import { api } from "@/lib/api";

export async function verifyAction(input: VerifyInput): Promise<{
  success: boolean;
  message: string;
  error?: VerifyError;
}> {
  try {
    const validate = await verifySchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body = {
      token: validate.data.token,
    };

    const res = await api.post("/platform/auth/verify", body);

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
    console.error("[Action.Auth.Verify] Error: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
