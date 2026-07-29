"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export async function adminGetLinkedAccountsAction(): Promise<{
  success: boolean;
  message: string;
  linkedAccounts?: { password: boolean; google: boolean; github: boolean };
}> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.get("/platform/admin/profile/linked-accounts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    return {
      success: res.data.success,
      message: res.data.message,
      linkedAccounts: res.data.linkedAccounts,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Admin.Profile.GetLinkedAccounts]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Admin.Profile.GetLinkedAccounts]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
