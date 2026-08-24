"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";

import { revalidatePath } from "next/cache";

export async function clientRevokeSessionAction(sessionId: string): Promise<{
  success: boolean;
  message: string;
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

    const res = await api.patch(
      `/platform/client/session/revoke/${sessionId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message,
      };
    }

    revalidatePath("/sessions");
    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.RevokeSession]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Client.RevokeSession]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
