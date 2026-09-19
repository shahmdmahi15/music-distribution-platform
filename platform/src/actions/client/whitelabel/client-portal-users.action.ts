"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelUserRole } from "@/types/whitelabel";

export interface PortalUserItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  role: WhiteLabelUserRole;
  twoFactorEnabled: boolean;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
  createdAt: string;
}

export async function clientGetPortalUsersAction(): Promise<{
  success: boolean;
  message?: string;
  users?: PortalUserItem[];
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch portal users.",
      };
    }

    return {
      success: true,
      users: data.users || [],
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetPortalUsers] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching portal users.",
    };
  }
}
