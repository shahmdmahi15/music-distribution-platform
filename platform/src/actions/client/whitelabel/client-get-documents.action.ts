"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export async function clientGetDocumentsAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Authentication session missing. Please log in.",
      documents: [],
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/documents`,
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
        message: data.message || "Failed to fetch documents.",
        documents: [],
      };
    }

    return {
      success: true,
      documents: data.documents || [],
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetDocuments] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching documents.",
      documents: [],
    };
  }
}
