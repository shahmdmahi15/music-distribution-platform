"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Session } from "@/types/session";

export async function clientGetAllSessionsAction(): Promise<{
  success: boolean;
  message: string;
  sessions?: Session[];
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

    const res = await api.get("/platform/client/session/all", {
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
      sessions: res.data.sessions,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.GetAllSessions]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Client.GetAllSessions]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
