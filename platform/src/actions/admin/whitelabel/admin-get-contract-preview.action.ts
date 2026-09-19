"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export async function adminGetContractPreviewAction(whiteLabelId: string) {
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/contract/preview`,
      {
        method: "GET",
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
        message: data.message || "Unable to retrieve contract preview.",
      };
    }

    return {
      success: true,
      contractUrl: data.contractUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      uploadedAt: data.uploadedAt,
      uploadedBy: data.uploadedBy,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.GetContractPreview] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while loading contract preview.",
    };
  }
}
