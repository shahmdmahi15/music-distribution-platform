"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Music, Sparkles } from "lucide-react";
import Link from "next/link";

export function AdminSidebarHeader() {
  return (
    <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/admin" />}
            size="lg"
            className="group/logo hover:bg-sidebar-accent/60 transition-all rounded-xl p-2"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover/logo:scale-105 transition-transform">
              <Music className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold tracking-tight text-foreground">
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
