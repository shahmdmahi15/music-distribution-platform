"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

export async function clientSaveOnboardingDraftAction(draftData: any): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.post(
      "/platform/client/whitelabel/onboarding/draft",
      draftData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      success: res.data?.success ?? true,
      message: res.data?.message || "Draft saved.",
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to save draft.",
      };
    }
    return { success: false, message: "Internal draft save error." };
  }
}

export async function clientGetOnboardingDraftAction(): Promise<{
  success: boolean;
  draft: any | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, draft: null };
    }

    const res = await api.get("/platform/client/whitelabel/onboarding/draft", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      success: true,
      draft: res.data?.draft || null,
    };
  } catch (error) {
    return { success: false, draft: null };
  }
}

export async function clientClearOnboardingDraftAction(): Promise<{
  success: boolean;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false };
    }

    await api.delete("/platform/client/whitelabel/onboarding/draft", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
