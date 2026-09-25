"use server";

import { api } from "@/lib/api";
import axios from "axios";
import { WhiteLabelTenant, WhiteLabelSignupModel } from "@/types/user";

export interface WhitelabelSetupInput {
  name: string;
  tagline?: string;
  description?: string;
  supportEmail: string;
  supportPhone?: string;
  copyrightText?: string;
  primaryColor?: string;
  accentColor?: string;
  themeMode?: string;
  themeRadius?: string;
  themeFont?: string;
  cardStyle?: string;
  navbarStyle?: string;
  userSignupModel?: WhiteLabelSignupModel;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  bannerUrl?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialSpotify?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialTiktok?: string;
}

export async function setupTenantAction(input: WhitelabelSetupInput): Promise<{
  success: boolean;
  message: string;
  tenant?: WhiteLabelTenant;
}> {
  try {
    const res = await api.post("/whitelabel/tenant/setup", input);

    if (res.data.error || !res.data.success) {
      return {
        success: false,
        message:
          res.data.message ||
          (Array.isArray(res.data.message)
            ? res.data.message.join(", ")
            : "Failed to complete setup."),
      };
    }

    return {
      success: true,
      message: res.data.message || "Setup completed successfully.",
      tenant: res.data.tenant,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred during setup.";
      return {
        success: false,
        message: Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg),
      };
    }

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Network error during setup.",
    };
  }
}
