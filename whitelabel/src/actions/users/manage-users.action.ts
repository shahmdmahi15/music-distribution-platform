"use server";

import { createUserSchema, CreateUserInput } from "@/schemas/users.schema";
import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";

export async function createUserAction(input: CreateUserInput): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  try {
    const validate = await createUserSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: validate.error.issues[0]?.message || "Validation Error",
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    const res = await api.post("/whitelabel/users", validate.data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to create user.",
      };
    }

    return {
      success: true,
      message: res.data.message || "User created successfully.",
      user: res.data.user,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create user.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}

export async function updateUserRoleAction(
  code: string,
  role: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    const res = await api.patch(
      `/whitelabel/users/${code}/role`,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: true,
      message: res.data.message || "Role updated successfully.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update role.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}

export async function toggleUserLockAction(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (!token) {
      return {
        success: false,
        message: "Authentication required.",
      };
    }

    const res = await api.patch(
      `/whitelabel/users/${code}/lock`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: true,
      message: res.data.message || "Account status updated.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update status.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
