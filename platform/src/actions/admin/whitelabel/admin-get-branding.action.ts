"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelBranding } from "@/types/whitelabel";

export async function adminGetBrandingAction(whiteLabelId: string): Promise<{
  success: boolean;
  message?: string;
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
        message: data.message || "Failed to fetch WhiteLabel branding.",
      };
    }

    return {
      success: true,
      branding: data.branding,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.GetBranding] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching WhiteLabel branding.",
    };
  }
}
