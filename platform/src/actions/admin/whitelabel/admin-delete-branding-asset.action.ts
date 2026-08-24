"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminDeleteBrandingAssetAction(
  whiteLabelId: string,
  assetType: string,
): Promise<{
  success: boolean;
  message: string;
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/branding/asset/${assetType}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to remove image.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    revalidatePath("/whitelabel/branding");
    return {
      success: true,
      message: data.message || "Image removed successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.DeleteBrandingAsset] Error:", error);
    return {
      success: false,
      message: "An error occurred while removing image.",
    };
  }
}
