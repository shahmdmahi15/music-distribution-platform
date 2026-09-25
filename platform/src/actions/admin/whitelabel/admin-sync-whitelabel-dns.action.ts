"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function adminSyncWhiteLabelDnsAction(
  whiteLabelId: string,
): Promise<{
  success: boolean;
  message: string;
  subdomain?: string;
  fqdn?: string;
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/${whiteLabelId}/sync-dns`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to synchronize Cloudflare DNS.",
      };
    }

    revalidatePath("/admin/whitelabels");
    return {
      success: true,
      message: data.message || "Cloudflare DNS synced successfully.",
      subdomain: data.subdomain,
      fqdn: data.fqdn,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.SyncDns] Error:", error);
    return {
      success: false,
      message: "An error occurred while syncing Cloudflare DNS.",
    };
  }
}
