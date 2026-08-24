"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminDeleteDocumentAction(documentId: string) {
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/documents/${documentId}`,
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
        message: data.message || "Failed to delete document.",
      };
    }

    revalidatePath("/admin/whitelabels");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "Document deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.DeleteDocument] Error:", error);
    return {
      success: false,
      message: "An error occurred while deleting document.",
    };
  }
}
