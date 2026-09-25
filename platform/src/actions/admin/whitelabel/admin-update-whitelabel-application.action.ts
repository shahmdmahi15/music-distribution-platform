"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabel } from "@/types/whitelabel";

export async function adminUpdateWhiteLabelApplicationAction(
  whiteLabelId: string,
  dto: Record<string, any>,
): Promise<{
  success: boolean;
  message: string;
  whiteLabel?: WhiteLabel;
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/application`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update WhiteLabel application details.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/whitelabel");
    revalidatePath("/");
    return {
      success: true,
      message:
        data.message ||
        "WhiteLabel application & operations dossier updated successfully.",
      whiteLabel: data.whiteLabel,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.UpdateApplication] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating WhiteLabel application details.",
    };
  }
}
