"use client";

import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Disc3, Music, Sparkles } from "lucide-react";
import { WhiteLabel } from "@/types/whitelabel";

export function ClientSidebarHeader({
  whiteLabel,
}: {
  whiteLabel?: WhiteLabel | null;
}) {
  const brandName = whiteLabel?.name || "RoyalMotionIT";
  const isApproved = whiteLabel?.status === "APPROVED";

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<div />}
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              {isApproved ? <Disc3 className="size-4" /> : <Music className="size-4" />}
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold text-foreground">
                {brandName}
              </span>
              <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                {isApproved ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    WhiteLabel Instance
                  </span>
                ) : (
                  <span>Client Console</span>
                )}
              </span>
            </div>

            <div
              className="group-data-[collapsible=icon]:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ThemeToggle />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
