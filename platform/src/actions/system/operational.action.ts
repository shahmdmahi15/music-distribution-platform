"use server";

import { api } from "@/lib/api";
import axios from "axios";

export async function operationalAction(): Promise<{ operational: boolean }> {
  try {
    const res = await api.get("/operational");

    if (res.data.error) {
      return {
        operational: false,
      };
    }

    return {
      operational: res.data.operational,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // No response at all (connection refused, timeout, DNS failure, etc.)
      // just means the API is unreachable — that's expected "not operational",
      // not a bug worth logging.
      if (!error.response) {
        return { operational: false };
      }

      console.error("[Action.System.Operational]:", {
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      console.error("[Action.System.Operational]: ", { error });
    }
    return {
      operational: false,
    };
  }
}
