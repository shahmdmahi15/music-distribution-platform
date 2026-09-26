"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelBranding, WhiteLabelSignupModel } from "@/types/whitelabel";

export interface ClientSetupWhiteLabelInput {
  name: string;
  tagline?: string;
  description?: string;
  supportEmail: string;
  supportPhone: string;
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
  customDomain?: string;
  bucketName?: string;
  elasticIpv4?: string;
  cloudflareZoneId?: string;
  cloudflareBaseDomain?: string;
  awsRegion?: string;
  awsInstanceType?: string;
  senderEmail?: string;
}

export async function clientSetupWhiteLabelAction(
  dto: ClientSetupWhiteLabelInput,
): Promise<{
  success: boolean;
  message: string;
  branding?: WhiteLabelBranding;
  generatedApiKey?: string | null;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return {
      success: false,
      message: "Session token not found. Please log in again.",
    };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/setup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(dto),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Failed to complete WhiteLabel setup.",
      };
    }

    revalidatePath("/whitelabel");
    revalidatePath("/whitelabel/setup");
    revalidatePath("/whitelabel/branding");
    revalidatePath("/whitelabel/theme");
    revalidatePath("/whitelabel/domain");
    revalidatePath("/whitelabel/sso");
    revalidatePath("/whitelabel/api-keys");
    revalidatePath("/whitelabel/webhooks");
    revalidatePath("/whitelabel/users");
    revalidatePath("/");
    return {
      success: true,
      message: data.message || "WhiteLabel setup completed successfully.",
      branding: data.branding,
      generatedApiKey: data.generatedApiKey || null,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.Setup] Error:", error);
    return {
      success: false,
      message: "An error occurred while saving WhiteLabel setup.",
    };
  }
}
