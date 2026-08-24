"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function clientUploadBrandingAssetAction(formData: FormData): Promise<{
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
      `${env.API_BASE_URL}/platform/client/whitelabel/branding/asset`,
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
        message: data.message || "Failed to upload branding image.",
      };
    }

    revalidatePath("/whitelabel/branding");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "Image uploaded successfully.",
      assetUrl: data.assetUrl,
      assetType: data.assetType,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UploadBrandingAsset] Error:", error);
    return {
      success: false,
      message: "An error occurred while uploading image.",
    };
  }
}
