"use server";

import { z } from "zod";
import {
  LoginError,
  LoginInput,
  loginSchema,
} from "@/schemas/auth/login.schema";
import { api } from "@/lib/api";
import { cookies } from "next/headers";

export async function loginAction(input: LoginInput): Promise<{
  success: boolean;
  message: string;
  requireMfa?: boolean;
  userId?: string;
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

    cookieStore.set("SESSION_TOKEN", res.data.sessionToken, {
      expires: new Date(Date.now() + 1000 * 60 * 60),
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    console.error("[Action.Auth.Login]: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
