"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { TenantLogo } from "@/components/tenant-logo";
import { useTenant } from "@/components/tenant-theme-provider";

export function WhiteLabelSidebarHeader() {
  const tenant = useTenant();
  const isVerified = Boolean(
    tenant?.domain?.verified || tenant?.customDomain,
  );

  return (
    <SidebarHeader className="border-b border-sidebar-border/60 p-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            render={<Link href="/" />}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!"
          >
            <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary ring-1 ring-sidebar-border/40 shrink-0 overflow-hidden">
              <TenantLogo
                tenant={tenant}
                className="size-7 object-contain rounded"
                fallbackIconClassName="size-4"
                fallbackContainerClassName="size-9 rounded-lg flex items-center justify-center text-white"
              />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-foreground">
                {tenant?.name || "Music Portal"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="truncate text-[11px] text-muted-foreground font-mono">
                  {tenant?.customDomain ||
                    (tenant?.subdomain
                      ? `${tenant.subdomain}.platform`
                      : "Music Node")}
                </span>
                {isVerified && (
                  <span
                    title="Verified Domain"
                    className="inline-flex shrink-0 text-emerald-500"
                  >
                    <CheckCircle2 className="size-3" />
                  </span>
                )}
              </div>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
