"use server";

import axios from "axios";
import { cookies } from "next/headers";
import { api } from "@/lib/api";
import { WhiteLabel } from "@/types/whitelabel";

export interface ApplyWhiteLabelPayload {
  name: string;
  businessType: string;
  companyWebsite?: string;
  country?: string;
  yearsInBusiness?: number;
  isIncorporated?: boolean;
  incorporationDocUrl?: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactLinkedIn?: string;
  catalogTrackCount?: number;
  monthlyTrackDelivery?: number;
  monthlyRevenueUsd?: number;
  hasDirectDeals?: boolean;
  currentDistributors?: string[];
  royaltySolutions?: string[];
  primaryCatalogLanguage?: string;
  wantsCatalogMigration?: boolean;
  hasSampleBasedCovers?: boolean;
  userSignupModel?: string;
  privacyPolicyAccepted?: boolean;
  marketingConsent?: boolean;
  topArtists?: {
    artistName: string;
    instagramHandle?: string;
    spotifyProfileUrl?: string;
    youtubeChannelUrl?: string;
    monthlyListeners?: number;
    orderIndex?: number;
  }[];
}

import { revalidatePath } from "next/cache";

export async function clientApplyWhiteLabelAction(
  payload: ApplyWhiteLabelPayload,
): Promise<{
  success: boolean;
  message: string;
  whiteLabel?: WhiteLabel;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("__Host-SESSION_TOKEN")?.value;

    if (!token) {
      return {
        success: false,
        message: "Session token not found. Please log in.",
      };
    }

    const res = await api.post("/platform/client/whitelabel/apply", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.error) {
      return {
        success: false,
        message: res.data.message || "Failed to submit application",
      };
    }

    revalidatePath("/");
    revalidatePath("/admin/whitelabels");
    return {
      success: res.data.success,
      message: res.data.message,
      whiteLabel: res.data.whiteLabel,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[Action.Client.ApplyWhiteLabel]:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to submit WhiteLabel application.",
      };
    }
    return {
      success: false,
      message: "An unexpected error occurred.",
    };
  }
}
