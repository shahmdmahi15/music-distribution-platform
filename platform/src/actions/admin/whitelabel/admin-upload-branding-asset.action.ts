"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminUploadBrandingAssetAction(
  whiteLabelId: string,
  formData: FormData,
): Promise<{
  success: boolean;
  message: string;
  assetUrl?: string;
  assetType?: string;
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/branding/asset`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to upload image.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    revalidatePath("/whitelabel/branding");
    return {
      success: true,
      message: data.message || "Image uploaded successfully.",
      assetUrl: data.assetUrl,
      assetType: data.assetType,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.UploadBrandingAsset] Error:", error);
    return {
      success: false,
      message: "An error occurred while uploading image.",
    };
  }
}
