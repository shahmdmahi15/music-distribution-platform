"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { WhiteLabelTheme } from "@/types/whitelabel";

export async function clientGetThemeAction(): Promise<{
  success: boolean;
  message?: string;
  theme?: WhiteLabelTheme;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/theme`,
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
        message: data.message || "Failed to fetch theme settings.",
      };
    }

    return { success: true, theme: data.theme };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetTheme] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching theme settings.",
    };
  }
}

export async function clientUpdateThemeAction(
  dto: Partial<WhiteLabelTheme>,
): Promise<{
  success: boolean;
  message: string;
  theme?: WhiteLabelTheme;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/theme`,
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
        message: data.message || "Failed to update theme settings.",
      };
    }

    return {
      success: true,
      message: data.message || "Theme updated successfully.",
      theme: data.theme,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdateTheme] Error:", error);
    return {
      success: false,
      message: "An error occurred while saving theme customization.",
    };
  }
}
