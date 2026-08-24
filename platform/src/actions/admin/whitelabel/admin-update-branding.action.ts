"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelBranding } from "@/types/whitelabel";

export async function adminUpdateBrandingAction(
  whiteLabelId: string,
  dto: Partial<WhiteLabelBranding>,
): Promise<{
  success: boolean;
  message: string;
  branding?: WhiteLabelBranding;
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/branding`,
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
        message: data.message || "Failed to update WhiteLabel branding.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    revalidatePath("/whitelabel/branding");
    return {
      success: true,
      message: data.message || "Branding updated successfully.",
      branding: data.branding,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.UpdateBranding] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating WhiteLabel branding.",
    };
  }
}
