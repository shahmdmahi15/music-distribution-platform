"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export interface FleetVersionTenant {
  id: string;
  code: string;
  name: string;
  subdomain: string;
  customDomain: string | null;
  status: string;
  awsElasticIp: string | null;
  installedVersion: string | null;
  installedCommitHash: string | null;
  lastUpdateCheckedAt: string | null;
  lastUpdatedAt: string | null;
  updateStatus: string | null;
  updateError: string | null;
  autoUpdateEnabled: boolean;
  isUpToDate: boolean;
  hasDedicatedEc2: boolean;
}

export interface LatestReleaseManifest {
  version: string;
  commitHash: string;
  buildTime: string;
  sha256: string;
  bundleSize: string;
  bundleSizeBytes: number;
}

export interface AdminFleetVersionsResponse {
  success: boolean;
  latestRelease?: LatestReleaseManifest;
  fleet?: FleetVersionTenant[];
  message?: string;
}

export async function adminGetFleetVersionsAction(): Promise<AdminFleetVersionsResponse> {
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
      `${env.API_BASE_URL}/platform/admin/whitelabels/fleet-versions`,
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
        message: data.message || "Failed to fetch fleet version telemetry.",
      };
    }

    return {
      success: true,
      latestRelease: data.latestRelease,
      fleet: data.fleet,
    };
  } catch (error) {
    console.error("[Action.Admin.WhiteLabel.GetFleetVersions] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching fleet version telemetry.",
    };
  }
}
