import React from "react";
import { redirect } from "next/navigation";
import { meAction } from "@/actions/auth/me.action";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const res = await meAction();

  if (!res.success || !res.user) {
    redirect("/auth/login");
  }

  return (
    <PortalLayoutWrapper>
      <ProfileContent user={res.user} tenant={res.tenant} />
    </PortalLayoutWrapper>
  );
}
