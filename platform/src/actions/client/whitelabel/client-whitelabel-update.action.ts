"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface WhiteLabelVersionStatus {
  id: string;
  code: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  awsElasticIp?: string | null;
  awsInstanceId?: string | null;
  awsInstanceState?: string | null;
  installedVersion?: string | null;
  installedCommitHash?: string | null;
  lastUpdateCheckedAt?: string | null;
  lastUpdatedAt?: string | null;
  updateStatus?: string | null;
  updateError?: string | null;
  autoUpdateEnabled?: boolean;
  isUpToDate: boolean;
  hasDedicatedEc2: boolean;
  latestRelease: {
    version: string;
    commitHash?: string;
    sha256?: string;
    buildTimestamp?: string;
  };
}

/**
 * Client server action to query software version and update availability for tenant's EC2 instance.
 */
export async function clientGetWhiteLabelVersionAction(): Promise<{
  success: boolean;
  message?: string;
  data?: WhiteLabelVersionStatus;
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
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/version`,
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
        message: data.message || "Failed to retrieve WhiteLabel version telemetry.",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("[Action.Client.WhiteLabel.Version] Error:", error);
    return {
      success: false,
      message: error?.message || "An unexpected error occurred while fetching version data.",
    };
  }
}

/**
 * Client server action to trigger an immediate autonomous update rollout on tenant's dedicated EC2 instance.
 */
export async function clientTriggerWhiteLabelUpdateAction(): Promise<{
  success: boolean;
  message: string;
  output?: string;
  error?: string;
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
      `${env.API_BASE_URL}/platform/client/whitelabel/provision/trigger-update`,
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
        message: data.message || "Failed to trigger WhiteLabel update.",
        error: data.error,
      };
    }

    revalidatePath("/whitelabel");
    revalidatePath("/whitelabel/setup");

    return {
      success: true,
      message: data.message || "WhiteLabel update deployed successfully to your server!",
      output: data.output,
    };
  } catch (error: any) {
    console.error("[Action.Client.WhiteLabel.TriggerUpdate] Error:", error);
    return {
      success: false,
      message: error?.message || "An error occurred while connecting to your server to trigger update.",
      error: error?.message,
    };
  }
}
