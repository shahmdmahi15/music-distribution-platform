"use server";

import { env } from "@/env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WhiteLabelUserRole } from "@/types/whitelabel";

export interface PortalUserItem {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  role: WhiteLabelUserRole;
  twoFactorEnabled: boolean;
  isApproved?: boolean;
  lastLoginAt?: string | null;
  lockedUntil?: string | null;
  createdAt: string;
}

export interface CreatePortalUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role?: WhiteLabelUserRole;
  password?: string;
}

export interface UpdatePortalUserPayload {
  firstName?: string;
  lastName?: string;
  role?: WhiteLabelUserRole;
}

export async function clientGetPortalUsersAction(): Promise<{
  success: boolean;
  message?: string;
  users?: PortalUserItem[];
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users`,
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
        message: data.message || "Failed to fetch portal users.",
      };
    }

    return {
      success: true,
      users: data.users || [],
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.GetPortalUsers] Error:", error);
    return {
      success: false,
      message: "An error occurred while fetching portal users.",
    };
  }
}

export async function clientCreatePortalUserAction(
  payload: CreatePortalUserPayload,
): Promise<{
  success: boolean;
  message: string;
  user?: PortalUserItem;
  temporaryPassword?: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users`,
      {
        method: "POST",
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
        message: data.message || "Failed to create portal user.",
      };
    }

    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    return {
      success: true,
      message: data.message || "Portal user created successfully.",
      user: data.user,
      temporaryPassword: data.temporaryPassword,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.CreatePortalUser] Error:", error);
    return {
      success: false,
      message: "An error occurred while creating portal user.",
    };
  }
}

export async function clientUpdatePortalUserAction(
  userId: string,
  payload: UpdatePortalUserPayload,
): Promise<{
  success: boolean;
  message: string;
  user?: PortalUserItem;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users/${userId}`,
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
        message: data.message || "Failed to update portal user.",
      };
    }

    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    return {
      success: true,
      message: data.message || "Portal user updated successfully.",
      user: data.user,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.UpdatePortalUser] Error:", error);
    return {
      success: false,
      message: "An error occurred while updating portal user.",
    };
  }
}

export async function clientResetPortalUserPasswordAction(
  userId: string,
  password: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users/${userId}/password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
        body: JSON.stringify({ password }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to reset user password.",
      };
    }

    revalidatePath("/whitelabel/users");
    return {
      success: true,
      message: data.message || "Password reset successfully.",
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.ResetPortalUserPassword] Error:",
      error,
    );
    return {
      success: false,
      message: "An error occurred while resetting user password.",
    };
  }
}

export async function clientToggleLockPortalUserAction(
  userId: string,
): Promise<{
  success: boolean;
  message: string;
  user?: PortalUserItem;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users/${userId}/lock`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update lock status.",
      };
    }

    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    return {
      success: true,
      message: data.message || "User status updated successfully.",
      user: data.user,
    };
  } catch (error) {
    console.error(
      "[Action.Client.WhiteLabel.ToggleLockPortalUser] Error:",
      error,
    );
    return {
      success: false,
      message: "An error occurred while updating user status.",
    };
  }
}

export async function clientApprovePortalUserAction(userId: string): Promise<{
  success: boolean;
  message: string;
  user?: PortalUserItem;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users/${userId}/approve`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to approve user.",
      };
    }

    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    return {
      success: true,
      message: data.message || "User approved successfully.",
      user: data.user,
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.ApprovePortalUser] Error:", error);
    return {
      success: false,
      message: "An error occurred while approving user.",
    };
  }
}

export async function clientDeletePortalUserAction(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;

  if (!sessionToken) {
    return { success: false, message: "Session token not found." };
  }

  try {
    const response = await fetch(
      `${env.API_BASE_URL}/platform/client/whitelabel/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "x-api-key": env.API_KEY,
        },
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to remove user.",
      };
    }

    revalidatePath("/whitelabel/users");
    revalidatePath("/whitelabel");
    return {
      success: true,
      message: data.message || "User removed successfully.",
    };
  } catch (error) {
    console.error("[Action.Client.WhiteLabel.DeletePortalUser] Error:", error);
    return {
      success: false,
      message: "An error occurred while removing user.",
    };
  }
}
