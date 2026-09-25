"use server";

import { verifyMfaSchema, VerifyMfaInput } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import {
  WL_MFA_CHALLENGE_COOKIE,
  WL_SESSION_COOKIE,
  WL_SESSION_TTL_MS,
} from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export async function verifyMfaAction(input: VerifyMfaInput): Promise<{
  success: boolean;
  message: string;
  user?: unknown;
}> {
  try {
    const validate = await verifyMfaSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const cookieStore = await cookies();
    const mfaToken = cookieStore.get(WL_MFA_CHALLENGE_COOKIE)?.value;

    if (!mfaToken) {
      return {
        success: false,
        message: "Two-factor challenge expired. Please sign in again.",
      };
    }

    const res = await api.post("/whitelabel/auth/verify-mfa", {
      mfaToken,
      code: validate.data.code,
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Invalid two-factor authentication code.",
      };
    }

    // Clear MFA challenge
    cookieStore.delete(WL_MFA_CHALLENGE_COOKIE);

    // Set authenticated session cookie
    cookieStore.set(WL_SESSION_COOKIE, res.data.token, {
      expires: new Date(Date.now() + WL_SESSION_TTL_MS),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    });

    return {
      success: true,
      message: res.data.message || "Authentication successful.",
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Whitelabel.VerifyMfaAction]:", error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || "MFA validation failed.",
      };
    }
    console.error("[Whitelabel.VerifyMfaAction]:", error);
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
