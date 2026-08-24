"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminUploadDocumentAction(
  whiteLabelId: string,
  formData: FormData,
) {
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/documents`,
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
        message: data.message || "Failed to upload document to storage.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "Document uploaded successfully.",
      document: data.document,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.UploadDocument] Error:", error);
    return {
      success: false,
      message: "An error occurred while uploading document.",
    };
  }
}
