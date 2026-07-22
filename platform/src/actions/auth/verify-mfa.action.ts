"use server";

import { z } from "zod";
import {
  VerifyMfaError,
  VerifyMfaInput,
  verifyMfaSchema,
} from "@/schemas/auth/verify-mfa.schema";
import { api } from "@/lib/api";
import { cookies } from "next/headers";

export async function verifyMfaAction(input: VerifyMfaInput): Promise<{
  success: boolean;
  message: string;
  error?: VerifyMfaError;
}> {
  try {
    const validate = await verifyMfaSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body = {
      userId: validate.data.userId,
      code: validate.data.code,
    };

    const res = await api.post("/platform/auth/verify-mfa", body);

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    const cookieStore = await cookies();

    cookieStore.set("__Host-SESSION_TOKEN", res.data.token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    console.error("[Action.Auth.VerifyMfa]: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
