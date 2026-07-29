"use client";

import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Music } from "lucide-react";

export function ClientSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<div />}
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Music className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">RoyalMotionIT</span>
              <span className="truncate text-xs text-muted-foreground">
                Client Panel
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
