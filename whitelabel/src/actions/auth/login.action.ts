"use server";

import { loginSchema, LoginInput } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import {
  WL_MFA_CHALLENGE_COOKIE,
  WL_MFA_CHALLENGE_TTL_MS,
  WL_SESSION_COOKIE,
  WL_SESSION_TTL_MS,
} from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export async function loginAction(input: LoginInput): Promise<{
  success: boolean;
  message: string;
  requireMfa?: boolean;
  redirectUrl?: string;
  user?: unknown;
}> {
  try {
    const validate = await loginSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const res = await api.post("/whitelabel/auth/login", validate.data);

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to sign in.",
      };
    }

    const cookieStore = await cookies();

    if (res.data.requireMfa) {
      cookieStore.set(WL_MFA_CHALLENGE_COOKIE, res.data.mfaToken, {
        expires: new Date(Date.now() + WL_MFA_CHALLENGE_TTL_MS),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        path: "/",
      });

      return {
        success: true,
        requireMfa: true,
        message: res.data.message,
      };
    }

    cookieStore.set(WL_SESSION_COOKIE, res.data.token, {
      expires: new Date(Date.now() + WL_SESSION_TTL_MS),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
    });

    return {
      success: true,
      message: res.data.message || "Signed in successfully",
      redirectUrl: "/",
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Whitelabel.LoginAction]:", error.response?.data);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Invalid credentials or request error",
      };
    }
    console.error("[Whitelabel.LoginAction]:", error);
    return {
      success: false,
      message: "An internal server action error occurred.",
    };
  }
}
