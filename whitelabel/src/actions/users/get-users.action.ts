"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";
import axios from "axios";
import { WhiteLabelUser } from "@/types/user";

export async function getUsersAction(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  message: string;
  items?: WhiteLabelUser[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

    const res = await api.get("/whitelabel/users", {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to fetch users.",
      };
    }

    return {
      success: true,
      message: res.data.message,
      items: res.data.items,
      pagination: res.data.pagination,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch users.",
      };
    }
    return {
      success: false,
      message: "An internal server error occurred.",
    };
  }
}
