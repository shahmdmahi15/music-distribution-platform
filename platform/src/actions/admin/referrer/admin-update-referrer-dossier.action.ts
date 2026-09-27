"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { Referrer } from "@/types/referrer";

export async function adminUpdateReferrerDossierAction(
  id: string,
  payload: Partial<Referrer>,
): Promise<{
  success: boolean;
  message: string;
  referrer?: Referrer;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return { success: false, message: "Session token not found." };
    }

    const res = await api.patch(`/platform/admin/referrers/${id}/dossier`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      success: res.data.success ?? true,
      message: res.data.message || "Referrer dossier updated.",
      referrer: res.data.referrer,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to update referrer dossier.",
      };
    }
    return { success: false, message: "Network error occurred." };
  }
}
