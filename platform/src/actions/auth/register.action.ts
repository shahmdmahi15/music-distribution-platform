"use server";

import { z } from "zod";
import {
  RegisterError,
  RegisterInput,
  registerSchema,
} from "@/schemas/auth/register.schema";
import { api } from "@/lib/api";

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

    const body = {
      firstName: validate.data.firstName,
      lastName: validate.data.lastName,
      email: validate.data.email,
      password: validate.data.password,
    };

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
    console.error("[Action.Auth.Register] Error: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
