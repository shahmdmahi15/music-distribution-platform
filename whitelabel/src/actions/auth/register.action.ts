"use server";

import { registerSchema, RegisterInput } from "@/schemas/auth.schema";
import { api } from "@/lib/api";
import axios from "axios";

export async function registerAction(input: RegisterInput): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  try {
    const validate = await registerSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const res = await api.post("/whitelabel/auth/register", validate.data);

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Registration failed.",
      };
    }

    return {
      success: true,
      message: res.data.message || "Account created successfully.",
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Whitelabel.RegisterAction]:", error.response?.data);
      return {
        success: false,
        message:
          error.response?.data?.message || "Registration could not be completed.",
      };
    }
    console.error("[Whitelabel.RegisterAction]:", error);
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
