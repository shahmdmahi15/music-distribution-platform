import React from "react";
import { PortalLayoutWrapper } from "@/components/portal-layout-wrapper";
import { SessionsContent } from "./sessions-content";

export default function SessionsPage() {
  return (
    <PortalLayoutWrapper>
      <SessionsContent />
    </PortalLayoutWrapper>
  );
}
