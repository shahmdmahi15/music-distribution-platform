"use server";

import { env } from "@/env";
import { cookies } from "next/headers";

export interface InfrastructureActionParams {
  action:
    | "RELOAD_PM2"
    | "RESTART_PM2"
    | "FLUSH_PM2_LOGS"
    | "RELOAD_NGINX"
    | "RESTART_NGINX"
    | "TEST_DATABASE_CONNECTION"
    | "TRIGGER_DATABASE_BACKUP"
    | "SEND_TEST_EMAIL"
    | "PURGE_CLOUDFLARE_CACHE"
    | "REBOOT_SERVER";
  target?: string;
  payload?: string;
  confirmationToken?: string;
}

export interface AdminInfrastructureActionResponse {
  success: boolean;
  message?: string;
  details?: any;
  error?: string;
}

export async function adminExecuteInfrastructureAction(
  params: InfrastructureActionParams,
): Promise<AdminInfrastructureActionResponse> {
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
      `${env.API_BASE_URL}/platform/admin/infrastructure/action`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        message:
          data.message || data.error || `Operation failed (${response.status})`,
        details: data.details,
      };
    }

    return {
      success: true,
      message: data.message || "Infrastructure operation completed successfully.",
      details: data.details,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to communicate with API server.",
    };
  }
}
