"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelDomainConfig, WhiteLabelDomainStatus } from "@/types/whitelabel";

export async function clientGetDomainAction(): Promise<{
  success: boolean;
  message?: string;
  domain?: WhiteLabelDomainConfig;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain`,
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
        message: data.message || "Failed to fetch domain configuration.",
      };
    }

    return { success: true, domain: data.domain };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetDomain] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching domain configuration.",
    };
  }
}

export async function clientUpdateDomainAction(
  payload?: string | { customDomain?: string; subdomain?: string },
): Promise<{
  success: boolean;
  message: string;
  subdomain?: string | null;
  customDomain?: string | null;
  status?: WhiteLabelDomainStatus;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  const body =
    typeof payload === "string"
      ? { customDomain: payload }
      : payload || {};

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update domain configuration.",
      };
    }

    return {
      success: true,
      message: data.message || "Domain configuration updated.",
      subdomain: data.domain?.subdomain,
      customDomain: data.domain?.customDomain ?? data.customDomain,
      status: data.status,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdateDomain] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating domain configuration.",
    };
  }
}

export async function clientVerifyDomainAction(): Promise<{
  success: boolean;
  message: string;
  status?: WhiteLabelDomainStatus;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain/verify`,
      {
        method: "POST",
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
        message: data.message || "DNS verification failed.",
      };
    }

    return {
      success: true,
      message: data.message || "Domain DNS verified successfully.",
      status: data.status,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.VerifyDomain] Error:", error);
    return {
      success: false,
      message: "An error occurred while running DNS verification.",
    };
  }
}
