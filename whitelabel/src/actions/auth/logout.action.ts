"use server";

import { api } from "@/lib/api";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { cookies } from "next/headers";

export async function logoutAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(WL_SESSION_COOKIE)?.value;

    if (token) {
      try {
        await api.post(
          "/whitelabel/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (err) {
        console.warn(
          "[Whitelabel.LogoutAction] Remote revocation failed:",
          err,
        );
      }
    }

    cookieStore.delete(WL_SESSION_COOKIE);

    return {
      success: true,
      message: "Signed out successfully.",
    };
  } catch (error) {
    console.error("[Whitelabel.LogoutAction]:", error);
    return {
      success: false,
      message: "An error occurred during sign out.",
    };
  }
}
