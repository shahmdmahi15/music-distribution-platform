"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelSsoConfig } from "@/types/whitelabel";

export async function clientGetSsoAction(): Promise<{
  success: boolean;
  message?: string;
  sso?: WhiteLabelSsoConfig;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/sso`,
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
        message: data.message || "Failed to fetch SSO credentials.",
      };
    }

    return { success: true, sso: data.sso };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetSso] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching SSO credentials.",
    };
  }
}

export async function clientUpdateSsoAction(
  dto: Partial<WhiteLabelSsoConfig> & {
    googleClientSecret?: string;
    githubClientSecret?: string;
    awsSecretAccessKey?: string;
    databaseUrl?: string;
    redisUrl?: string;
    cloudflareApiToken?: string;
  },
): Promise<{
  success: boolean;
  message: string;
  sso?: WhiteLabelSsoConfig;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/sso`,
      {
        method: "PATCH",
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
        message: data.message || "Failed to update SSO credentials.",
      };
    }

    return {
      success: true,
      message: data.message || "SSO credentials updated.",
      sso: data.sso,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdateSso] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating SSO credentials.",
    };
  }
}

export async function clientTestCredentialsAction(
  type: "aws_s3" | "aws_ses" | "database" | "redis" | "cloudflare",
): Promise<{
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
      `${env.API_BASE_URL}/platform/client/whitelabel/credentials/test`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Test failed for ${type}.`,
      };
    }

    return {
      success: data.success ?? true,
      message: data.message || `Test completed successfully for ${type}.`,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.TestCredentials] Error:", error);
    return {
      success: false,
      message: "An error occurred while verifying credentials.",
    };
  }
}
