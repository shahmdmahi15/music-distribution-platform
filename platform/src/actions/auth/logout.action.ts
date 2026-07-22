"use server";

import { api } from "@/lib/api";
import { cookies } from "next/headers";

export async function logoutAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("__Host-SESSION_TOKEN");

    const body = {
      token: token,
    };

    const res = await api.post("/platform/auth/logout", body);

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    cookieStore.delete("__Host-SESSION_TOKEN");

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    console.error("[Action.Auth.Logout]: ", { error });
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
