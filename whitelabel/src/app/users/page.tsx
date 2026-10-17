import React from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { UsersContent } from "./users-content";

export const metadata = {
  title: "Team & Roster Management | WhiteLabel Portal",
  description: "Manage administrative users, signed artists, and portal roles.",
};

export default function UsersManagementPage() {
  return (
    <PortalLayoutWrapper>
      <UsersContent />
    </PortalLayoutWrapper>
  );
}
