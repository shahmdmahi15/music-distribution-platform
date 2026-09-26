"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelSignupModel } from "@/types/whitelabel";

export interface InviteCodeItem {
  code: string;
  maxUses?: number | null;
  usedCount: number;
  expiresAt?: string | null;
  note?: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface RegistrationPolicySettings {
  inviteCodes?: InviteCodeItem[];
  requireEmailVerification?: boolean;
  defaultRole?: string | null;
  customWelcomeMessage?: string | null;
  allowDirectApplication?: boolean;
}

export interface RegistrationPolicyData {
  userSignupModel: WhiteLabelSignupModel;
  policySettings: RegistrationPolicySettings;
  stats: {
    totalUsers: number;
    pendingApprovals: number;
    activeInviteCodes: number;
  };
}

export async function clientGetRegistrationPolicyAction(): Promise<{
  success: boolean;
  message?: string;
  policy?: RegistrationPolicyData;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/policy`,
      {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch registration policy.",
      };
    }

    return {
      success: true,
      policy: data.policy,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.GetRegistrationPolicy] Error:",
      error,
    );
    return {
      success: false,
      message: "An error occurred while fetching registration policy.",
    };
  }
}

export async function clientUpdateRegistrationPolicyAction(payload: {
  userSignupModel?: WhiteLabelSignupModel;
  policySettings?: RegistrationPolicySettings;
}): Promise<{
  success: boolean;
  message: string;
  policy?: RegistrationPolicyData;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/policy`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update registration policy.",
      };
    }

    revalidatePath("/whitelabel/policy");
    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    revalidatePath("/");

    return {
      success: true,
      message: data.message || "Registration policy updated successfully.",
      policy: data.policy,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.UpdateRegistrationPolicy] Error:",
      error,
    );
    return {
      success: false,
      message: "An error occurred while updating registration policy.",
    };
  }
}
