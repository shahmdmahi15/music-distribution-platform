"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminTriggerWhiteLabelUpdateAction(
  whiteLabelId: string,
): Promise<{
  success: boolean;
  message: string;
  output?: string;
  error?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Session token not found.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/trigger-update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to trigger WhiteLabel update.",
        error: data.error,
      };
    }

    revalidatePath("/admin/whitelabels");
    return {
      success: true,
      message: data.message || "WhiteLabel update executed successfully.",
      output: data.output,
    };
  } catch (error: any) {
    console.error("[Action.Admin.WhiteLabel.TriggerUpdate] Error:", error);
    return {
      success: false,
      message: "An error occurred while triggering the WhiteLabel update.",
      error: error?.message,
    };
  }
}
