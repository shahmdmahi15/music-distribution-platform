"use client";

import * as React from "react";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { WhiteLabelSidebarHeader } from "./whitelabel-sidebar-header";
import { WhiteLabelSidebarContent } from "./whitelabel-sidebar-content";
import { WhiteLabelSidebarFooter } from "./whitelabel-sidebar-footer";

export function WhiteLabelSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <WhiteLabelSidebarHeader />
      <WhiteLabelSidebarContent />
      <WhiteLabelSidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
