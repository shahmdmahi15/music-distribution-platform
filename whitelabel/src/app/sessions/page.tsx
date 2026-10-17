import React from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { SessionsContent } from "./sessions-content";

export const metadata = {
  title: "Active Device Sessions | Security",
  description: "Manage and revoke authenticated portal sessions and connected devices.",
};

export default function SessionsPage() {
  return (
    <PortalLayoutWrapper>
      <SessionsContent />
    </PortalLayoutWrapper>
  );
}
