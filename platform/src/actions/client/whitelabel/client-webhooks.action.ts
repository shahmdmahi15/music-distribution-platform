"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import {
  WhiteLabelWebhookConfig,
  WhiteLabelWebhookLog,
} from "@/types/whitelabel";

export async function clientGetWebhooksAction(): Promise<{
  success: boolean;
  message?: string;
  webhook?: WhiteLabelWebhookConfig;
  logs?: WhiteLabelWebhookLog[];
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/webhooks`,
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
        message: data.message || "Failed to fetch webhook settings.",
      };
    }

    return {
      success: true,
      webhook: data.webhook,
      logs: data.logs || [],
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetWebhooks] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching webhook configuration.",
    };
  }
}

export async function clientUpdateWebhooksAction(dto: {
  url: string;
  events: string[];
  isActive: boolean;
}): Promise<{
  success: boolean;
  message: string;
  webhook?: WhiteLabelWebhookConfig;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/webhooks`,
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
        message: data.message || "Failed to update webhook configuration.",
      };
    }

    return {
      success: true,
      message: data.message || "Webhook configuration saved.",
      webhook: data.webhook,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdateWebhooks] Error:", error);
    return {
      success: false,
      message: "An error occurred while saving webhook configuration.",
    };
  }
}

export async function clientTestWebhookAction(eventType?: string): Promise<{
  success: boolean;
  message: string;
  log?: WhiteLabelWebhookLog;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/webhooks/test`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventType }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to trigger webhook test.",
      };
    }

    return {
      success: true,
      message: data.message || "Webhook test completed.",
      log: data.log,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.TestWebhook] Error:", error);
    return {
      success: false,
      message: "An error occurred while executing webhook test.",
    };
  }
}
