"use server";

import { api } from "@/lib/api";
import axios from "axios";
import { WhiteLabelTenant } from "@/types/user";
import { env } from "@/env";

export interface TenantDiagnostics {
  apiKeyProvided: boolean;
  maskedKey?: string;
  apiBaseUrl: string;
  statusCode?: number;
  subdomainConfigured?: string;
  details?: string;
}

export async function getTenantAction(): Promise<{
  success: boolean;
  message: string;
  tenant?: WhiteLabelTenant;
  diagnostics?: TenantDiagnostics;
}> {
  const rawKey = env.API_KEY || "";
  const maskedKey = rawKey
    ? `${rawKey.slice(0, 10)}...${rawKey.slice(-6)}`
    : undefined;

  const baseDiagnostics: TenantDiagnostics = {
    apiKeyProvided: !!rawKey && rawKey.length > 5,
    maskedKey,
    apiBaseUrl: env.API_BASE_URL,
  };

  try {
    const res = await api.get("/whitelabel/tenant");

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message: res.data.message || "Failed to load tenant info.",
        diagnostics: {
          ...baseDiagnostics,
          statusCode: res.status,
          details: JSON.stringify(res.data, null, 2),
        },
      };
    }

    return {
      success: true,
      message: res.data.message,
      tenant: res.data.tenant,
      diagnostics: {
        ...baseDiagnostics,
        statusCode: res.status,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to connect to WhiteLabel API.",
        diagnostics: {
          ...baseDiagnostics,
          statusCode: error.response?.status,
          details: JSON.stringify(
            {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
            },
            null,
            2,
          ),
        },
      };
    }
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected network error occurred while reaching the API.",
      diagnostics: {
        ...baseDiagnostics,
        details: String(error),
      },
    };
  }
}
