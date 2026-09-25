import React from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { UsersContent } from "./users-content";

export default function UsersManagementPage() {
  return (
    <PortalLayoutWrapper>
      <UsersContent />
    </PortalLayoutWrapper>
  );
}
