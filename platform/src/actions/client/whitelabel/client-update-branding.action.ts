"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelBranding } from "@/types/whitelabel";

export async function clientUpdateBrandingAction(dto: Partial<WhiteLabelBranding>): Promise<{
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
      `${env.API_BASE_URL}/platform/client/whitelabel/branding`,
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
        message: data.message || "Failed to update branding settings.",
      };
    }

    revalidatePath("/whitelabel/branding");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "Branding settings saved successfully.",
      branding: data.branding,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdateBranding] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating branding settings.",
    };
  }
}
