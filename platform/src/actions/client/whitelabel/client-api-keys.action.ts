"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelApiKey } from "@/types/whitelabel";

export async function clientGetApiKeysAction(): Promise<{
  success: boolean;
  message?: string;
  keys?: WhiteLabelApiKey[];
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/api-keys`,
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
        message: data.message || "Failed to fetch API keys.",
      };
    }

    return { success: true, keys: data.keys || [] };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetApiKeys] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching API keys.",
    };
  }
}

export async function clientCreateApiKeyAction(dto: {
  name: string;
  scopes: string[];
}): Promise<{
  success: boolean;
  message: string;
  secretKey?: string;
  key?: WhiteLabelApiKey;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/api-keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to generate API key.",
      };
    }

    return {
      success: true,
      message: data.message || "API key generated.",
      secretKey: data.secretKey,
      key: data.key,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.CreateApiKey] Error:", error);
    return {
      success: false,
      message: "An error occurred while generating API key.",
    };
  }
}

export async function clientRevokeApiKeyAction(keyId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/api-keys/${keyId}`,
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
        message: data.message || "Failed to revoke API key.",
      };
    }

    return {
      success: true,
      message: data.message || "API key revoked.",
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.RevokeApiKey] Error:", error);
    return {
      success: false,
      message: "An error occurred while revoking API key.",
    };
  }
}
