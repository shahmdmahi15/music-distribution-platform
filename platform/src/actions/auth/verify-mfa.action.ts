"use server";

import { z } from "zod";
import {
  VerifyMfaError,
  VerifyMfaInput,
  verifyMfaSchema,
} from "@/schemas/auth/verify-mfa.schema";
import { api } from "@/lib/api";
import { MFA_CHALLENGE_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export async function verifyMfaAction(input: VerifyMfaInput): Promise<{
  success: boolean;
  message: string;
  redirectUrl?: string;
  user?: any;
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

    const cookieStore = await cookies();

    // Read the challenge from its cookie rather than trusting the request body:
    // the token is what proves a password check happened for this account.
    const mfaToken = cookieStore.get(MFA_CHALLENGE_COOKIE)?.value;

    if (!mfaToken) {
      return {
        success: false,
        message: "Your verification session has expired. Please sign in again.",
      };
    }

    const body = {
      mfaToken,
      code: validate.data.code,
    };

    const res = await api.post("/platform/auth/verify-mfa", body);

    // The API consumes the challenge on every outcome, correct code or not, so
    // the cookie is spent either way and must not outlive this call.
    cookieStore.set(MFA_CHALLENGE_COOKIE, "", {
      maxAge: 0,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    cookieStore.set("__Host-SESSION_TOKEN", res.data.token, {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    const userRole = res.data.user?.role;
    const redirectUrl =
      userRole === "CLIENT" ? "/" : "/admin/whitelabels";

    return {
      success: res.data.success,
      message: res.data.message,
      redirectUrl,
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Auth.Me]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.VerifyMfa]: ", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
