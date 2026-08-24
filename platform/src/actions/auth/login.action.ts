"use server";

import { z } from "zod";
import {
  LoginError,
  LoginInput,
  loginSchema,
} from "@/schemas/auth/login.schema";
import { api } from "@/lib/api";
import { cookies } from "next/headers";
import axios from "axios";

export async function loginAction(input: LoginInput): Promise<{
  success: boolean;
  message: string;
  requireMfa?: boolean;
  userId?: string;
  redirectUrl?: string;
  user?: any;
  error?: LoginError;
}> {
  try {
    const validate = await loginSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body = {
      email: validate.data.email,
      password: validate.data.password,
    };

    const res = await api.post("/platform/auth/login", body);

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    if (res.data.require2FA) {
      return {
        success: true,
        requireMfa: res.data.requireMfa,
        userId: res.data.userId,
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
      console.error("[Action.Auth.Login]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Auth.Login]: ", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
