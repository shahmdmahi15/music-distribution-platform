"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { RoyalMotionLogo } from "@/components/brand/royalmotion-logo";

export function AdminSidebarHeader() {
  return (
    <SidebarHeader className="h-16 shrink-0 justify-center border-b border-border/60 px-3 py-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/admin" />}
            size="lg"
            className="group/logo hover:bg-sidebar-accent/60 transition-all rounded-xl px-2 py-1.5"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg group-hover/logo:scale-105 transition-transform">
              <RoyalMotionLogo variant="icon" imageClassName="size-7" priority />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold tracking-tight text-foreground font-heading">
                  RoyalMotionIT
                </span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-primary" />
                <span>Admin Console</span>
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
