"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminSuspendWhiteLabelAction(
  id: string,
  reason?: string,
): Promise<{
  success: boolean;
  message: string;
  whiteLabel?: any;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Authentication session missing. Please log in.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/admin/whitelabels/${id}/suspend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify({ reason }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to suspend WhiteLabel.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "WhiteLabel has been suspended successfully.",
      whiteLabel: data.whiteLabel,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.Suspend] Error:", error);
    return {
      success: false,
      message: "An error occurred while suspending WhiteLabel.",
    };
  }
}
