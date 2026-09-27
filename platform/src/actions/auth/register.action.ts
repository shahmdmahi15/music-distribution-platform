"use server";

import { z } from "zod";
import {
  RegisterError,
  RegisterInput,
  registerSchema,
} from "@/schemas/auth/register.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function registerAction(input: RegisterInput): Promise<{
  success: boolean;
  message: string;
  error?: RegisterError;
}> {
  try {
    const validate = await registerSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }

    const body: Record<string, any> = {
      firstName: validate.data.firstName,
      lastName: validate.data.lastName,
      email: validate.data.email,
      password: validate.data.password,
    };

    if (validate.data.referralCode && validate.data.referralCode.trim()) {
      body.referralCode = validate.data.referralCode.trim().toUpperCase();
    }

    const res = await api.post("/platform/auth/register", body);

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
    let message = "Internal Server Action Error";
    if (axios.isAxiosError(error)) {
      console.error("[Action.Auth.Register]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      if (typeof error.response?.data?.message === "string") {
        message = error.response.data.message;
      }
    } else {
      console.error("[Action.Auth.Register] Error: ", error);
    }
    return {
      success: false,
      message,
    };
  }
}

export async function lookupReferralCodeAction(code: string): Promise<{
  success: boolean;
  valid: boolean;
  message?: string;
  referrerName?: string;
  referralCode?: string;
}> {
  try {
    if (!code || !code.trim()) {
      return { success: false, valid: false, message: "Code is required" };
    }
    const clean = code.trim().toUpperCase();
    const res = await api.get(`/platform/auth/referral-lookup/${encodeURIComponent(clean)}`);
    return {
      success: true,
      valid: res.data.valid ?? false,
      message: res.data.message,
      referrerName: res.data.referrerName,
      referralCode: res.data.referralCode,
    };
  } catch (error) {
    return { success: false, valid: false, message: "Unable to verify partner code" };
  }
}
