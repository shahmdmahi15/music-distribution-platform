"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export async function adminGetDocumentPreviewAction(docId: string) {
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/documents/${docId}/preview`,
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
        message: data.message || "Unable to retrieve document preview link.",
      };
    }

    return {
      success: true,
      fileUrl: data.fileUrl,
      name: data.name,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.GetDocumentPreview] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while loading document preview.",
    };
  }
}
