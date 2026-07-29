"use server";

import { z } from "zod";
import {
  ClientImageUpdateInput,
  clientImageUpdateSchema,
} from "@/schemas/client/profile/client-image-update.schema";
import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function clientImageUpdateAction(input: ClientImageUpdateInput) {
  try {
    const validate = await clientImageUpdateSchema.safeParseAsync(input);

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
      image: validate.data.image,
    };

    const res = await api.patch("/platform/client/profile/image", body, {
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
      console.error("[Action.Client.Profile.ImageUpdate]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[Action.Client.Profile.ImageUpdate]:", error);
    }
    return {
      success: false,
      message: "Internal Server Action Error",
    };
  }
}
