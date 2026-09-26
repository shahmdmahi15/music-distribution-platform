"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelProvisioningTelemetry } from "@/types/whitelabel";

export interface ValidateCloudCredentialsInput {
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  cloudflareApiToken: string;
  cloudflareZoneId: string;
  cloudflareBaseDomain: string;
}

export interface StartCloudProvisioningInput extends ValidateCloudCredentialsInput {
  bucketName?: string;
  senderEmail?: string;
  instanceType?: string;
  customDomain?: string;
  subdomain?: string;
  elasticIpv4?: string;
  cloudflareOriginCert?: string;
  cloudflareOriginKey?: string;
  recreateInstance?: boolean;
}

export async function clientValidateCloudCredentialsAction(
  dto: ValidateCloudCredentialsInput,
): Promise<{
  success: boolean;
  message: string;
  checks?: {
    aws: boolean;
    cloudflare: boolean;
    details: string[];
  };
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Session token not found. Please log in again.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/validate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to validate cloud credentials.",
      };
    }

    return {
      success: true,
      message: data.message || "Cloud credentials validated successfully.",
      checks: data.checks,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.Provision.Validate] Error:",
      error,
    );
    return {
      success: false,
      message:
        "An unexpected network error occurred while validating credentials.",
    };
  }
}

export async function clientStartCloudProvisioningAction(
  dto: StartCloudProvisioningInput,
): Promise<{
  success: boolean;
  message: string;
  whiteLabelId?: string;
  customDomain?: string;
  status?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Session token not found. Please log in again.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/start`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to launch cloud provisioning.",
      };
    }

    revalidatePath("/whitelabel");
    revalidatePath("/whitelabel/setup");
    return {
      success: true,
      message: data.message || "Provisioning pipeline initiated.",
      whiteLabelId: data.whiteLabelId,
      customDomain: data.customDomain,
      status: data.status,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.Provision.Start] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while starting provisioning.",
    };
  }
}

export async function clientGetProvisioningStatusAction(): Promise<{
  success: boolean;
  message?: string;
  telemetry?: WhiteLabelProvisioningTelemetry;
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
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/status`,
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
        message: data.message || "Failed to fetch provisioning status.",
      };
    }

    return {
      success: true,
      telemetry: data.data,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.Provision.Status] Error:", error);
    return {
      success: false,
      message: "Network error fetching provisioning status.",
    };
  }
}

export async function clientSaveCloudCredentialsAction(
  dto: StartCloudProvisioningInput,
): Promise<{
  success: boolean;
  message: string;
  whiteLabelId?: string;
  customDomain?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Session token not found. Please log in again.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to save cloud credentials.",
      };
    }

    revalidatePath("/whitelabel");
    revalidatePath("/whitelabel/setup");
    return {
      success: true,
      message: data.message || "Cloud credentials saved successfully.",
      whiteLabelId: data.whiteLabelId,
      customDomain: data.customDomain,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.Provision.SaveCredentials] Error:",
      error,
    );
    return {
      success: false,
      message: "An unexpected network error occurred while saving credentials.",
    };
  }
}
