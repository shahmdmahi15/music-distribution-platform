"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Disc3, Music, Sparkles } from "lucide-react";
import { WhiteLabel } from "@/types/whitelabel";
import Link from "next/link";

export function ClientSidebarHeader({
  whiteLabel,
}: {
  whiteLabel?: WhiteLabel | null;
}) {
  const brandName = whiteLabel?.name || "RoyalMotionIT";
  const isApproved = whiteLabel?.status === "APPROVED";

  return (
    <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/" />}
            size="lg"
            className="group/logo hover:bg-sidebar-accent/60 transition-all rounded-xl p-2"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover/logo:scale-105 transition-transform">
              {isApproved ? (
                <Disc3 className="size-4 animate-[spin_8s_linear_infinite]" />
              ) : (
                <Music className="size-4" />
              )}
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold tracking-tight text-foreground">
                {brandName}
              </span>
              <span className="truncate text-[11px] text-muted-foreground flex items-center gap-1">
                {isApproved ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      WhiteLabel Studio
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3 text-primary" />
                    <span>Client Portal</span>
                  </>
                )}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
