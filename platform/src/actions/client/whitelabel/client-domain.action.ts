"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import {
  WhiteLabelDomainConfig,
  WhiteLabelDomainStatus,
  DomainHealthReport,
} from "@/types/whitelabel";

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

export async function clientSuggestSubdomainAction(name: string): Promise<{
  success: boolean;
  subdomain?: string;
  fqdn?: string;
  message?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/subdomain/suggest?name=${encodeURIComponent(name)}`,
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
        message: data.message || "Failed to generate unique subdomain.",
      };
    }

    return {
      success: true,
      subdomain: data.subdomain,
      fqdn: data.fqdn,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.SuggestSubdomain] Error:", error);
    return {
      success: false,
      message: "An error occurred while generating subdomain.",
    };
  }
}

export async function clientUpdateDomainAction(
  payload?:
    | string
    | { customDomain?: string; subdomain?: string; elasticIpv4?: string },
): Promise<{
  success: boolean;
  message: string;
  subdomain?: string | null;
  customDomain?: string | null;
  elasticIpv4?: string | null;
  status?: WhiteLabelDomainStatus;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  const body =
    typeof payload === "string" ? { customDomain: payload } : payload || {};

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
      elasticIpv4: data.domain?.elasticIpv4,
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

export async function clientVerifyCloudflareInterconnectionAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      step: "SESSION_MISSING",
      message: "Session token not found.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain/verify-cloudflare`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.VerifyCloudflareInterconnection] Error:",
      error,
    );
    return {
      success: false,
      step: "NETWORK_ERROR",
      message: "An error occurred while connecting to Cloudflare.",
    };
  }
}

export async function clientHoldAndVerifyDomainAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain/hold-and-verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.HoldAndVerifyDomain] Error:",
      error,
    );
    return {
      success: false,
      message: "An error occurred while holding and verifying custom domain.",
    };
  }
}

export async function clientApplyCnameAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain/apply-cname`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.ApplyCname] Error:", error);
    return {
      success: false,
      message: "An error occurred while applying CNAME routing.",
    };
  }
}

export async function clientSyncPlatformSubdomainDnsAction(): Promise<{
  success: boolean;
  message: string;
  subdomain?: string;
  fqdn?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/domain/sync-subdomain`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.SyncSubdomain] Error:", error);
    return {
      success: false,
      message: "An error occurred while syncing platform subdomain DNS.",
    };
  }
}

export async function clientGetDomainHealthAction(
  forceRefresh = false,
): Promise<{
  success: boolean;
  message?: string;
  health?: DomainHealthReport;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const url = `${env.API_BASE_URL}/platform/client/whitelabel/domain/health`;
    const response = await fetch(url, {
      method: forceRefresh ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        "x-api-key": env.API_KEY,
      },
      cache: "no-store",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetDomainHealth] Error:", error);
    return {
      success: false,
      message: "An error occurred while checking domain health.",
    };
  }
}
