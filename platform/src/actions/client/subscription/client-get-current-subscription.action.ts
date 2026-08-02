"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Subscription } from "@/types/subscription";

export async function clientGetCurrentSubscriptionAction(): Promise<{
  success: boolean;
  message: string;
  subscription?: Subscription;
}> {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const res = await api.get("/platform/client/subscription/current", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    return {
      success: res.data.success,
      message: res.data.message,
      subscription: res.data.subscription,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.GetCurrentSubscription]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Client.GetCurrentSubscription]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
