"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export interface SystemProcessItem {
  id: number;
  name: string;
  status: string;
  pid: number;
  cpu: number;
  memory: number;
  memoryFormatted: string;
  restarts: number;
  uptimeSeconds: number;
  mode: string;
  version?: string;
  nodeVersion?: string;
}

export interface DiskPartitionItem {
  mountPoint: string;
  filesystem: string;
  sizeBytes: number;
  sizeFormatted: string;
  usedBytes: number;
  usedFormatted: string;
  availableBytes: number;
  availableFormatted: string;
  usedPercent: number;
}

export interface BackupHistoryItem {
  filename: string;
  sizeFormatted: string;
  sizeBytes: number;
  createdAt: string;
  hasChecksum: boolean;
}

export interface InfrastructureOverviewData {
  generatedAt: string;
  host: {
    hostname: string;
    platform: string;
    release: string;
    arch: string;
    osType: string;
    kernel: string;
    nodeVersion: string;
    uptimeSeconds: number;
    uptimeFormatted: string;
    cpu: {
      model: string;
      cores: number;
      loadAvg1m: number;
      loadAvg5m: number;
      loadAvg15m: number;
      usagePercent: number;
    };
    memory: {
      totalBytes: number;
      totalFormatted: string;
      freeBytes: number;
      freeFormatted: string;
      usedBytes: number;
      usedFormatted: string;
      usedPercent: number;
    };
  };
  disks: DiskPartitionItem[];
  pm2: {
    isAvailable: boolean;
    totalProcesses: number;
    onlineProcesses: number;
    processes: SystemProcessItem[];
  };
  database: {
    engine: string;
    version: string;
    sizeFormatted: string;
    sizeBytes: number;
    activeConnections: number;
    maxConnections: number;
    latencyMs: number;
    status: "HEALTHY" | "DEGRADED" | "DISCONNECTED";
    tables: {
      whiteLabels: number;
      releases: number;
      tracks: number;
      users: number;
      contracts: number;
      payees: number;
      dspReports: number;
      royaltyRuns: number;
    };
    backup: {
      latestBackup: BackupHistoryItem | null;
      totalBackups: number;
      backupDirectory: string;
      automatedDailyCron: string;
    };
  };
  storage: {
    bucketName: string;
    region: string;
    tier: string;
    status: "HEALTHY" | "CONFIGURED";
    totalAudioTracksStored: number;
    totalCoverArtStored: number;
  };
  mailing: {
    provider: string;
    senderEmail: string;
    region: string;
    mailFromDomain: string;
    status: "ACTIVE" | "SANDBOX" | "CONFIGURED";
    dailyQuotaSent: number;
    dailyQuotaLimit: number;
    maxSendRate: number;
  };
  edge: {
    provider: string;
    zoneDomain: string;
    sslMode: string;
    tlsVersion: string;
    elasticIp: string;
    status: "HEALTHY" | "PROXIED";
    ddosProtection: boolean;
    wafRulesActive: number;
  };
  whitelabelFleet: {
    totalTenants: number;
    activeTenants: number;
    provisionedTenants: number;
    updatingTenants: number;
    errorTenants: number;
    latestReleaseVersion: string;
    latestReleaseCommit: string;
    bundleSizeBytes: number;
    bundleSizeFormatted: string;
  };
  services: {
    nginx: "active" | "inactive" | "unknown";
    postgresql: "active" | "inactive" | "unknown";
    pm2: "active" | "inactive" | "unknown";
    firewall: "active" | "inactive" | "unknown";
  };
}

export interface AdminInfrastructureOverviewResponse {
  success: boolean;
  data?: InfrastructureOverviewData;
  message?: string;
  error?: string;
}

export async function adminGetInfrastructureOverviewAction(): Promise<AdminInfrastructureOverviewResponse> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Authentication session expired. Please sign in again.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/admin/infrastructure/overview`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        message: `API error (${response.status}): ${errText.slice(0, 200)}`,
      };
    }

    const data: InfrastructureOverviewData = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to retrieve infrastructure overview.",
    };
  }
}
