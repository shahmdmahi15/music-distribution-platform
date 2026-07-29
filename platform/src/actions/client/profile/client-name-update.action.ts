"use server";

import { z } from "zod";
import {
  ClientNameUpdateInput,
  clientNameUpdateSchema,
} from "@/schemas/client/profile/client-name-update.schema";
import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function clientNameUpdateAction(input: ClientNameUpdateInput) {
  try {
    const validate = await clientNameUpdateSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation Error",
        error: z.flattenError(validate.error),
      };
    }
    const cookieStore = await cookies();

    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session Token Not Found",
      };
    }

    const body = {
      firstName: validate.data.firstName,
      lastName: validate.data.lastName,
    };

    const res = await api.patch("/platform/client/profile/name", body, {
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

    revalidatePath("/client/profile");

    return {
      success: res.data.success,
      message: res.data.message,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.Profile.NameUpdate]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Client.Profile.NameUpdate]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
