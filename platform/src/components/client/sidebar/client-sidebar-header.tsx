"use client";

import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Disc3, Music, Sparkles } from "lucide-react";
import { WhiteLabel, WhiteLabelStatus } from "@/types/whitelabel";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function ClientSidebarHeader({
  whiteLabel,
}: {
  whiteLabel?: WhiteLabel | null;
}) {
  const brandName = whiteLabel?.name || "RoyalMotionIT";
  const isApproved = whiteLabel?.status === WhiteLabelStatus.ACTIVE;

  const statusLabel = whiteLabel?.status
    ? whiteLabel.status.replace("_", " ").toLowerCase()
    : "Onboarding";

  const statusTooltip = `${brandName} • ${
    isApproved ? "WhiteLabel Studio (Live)" : `Client Portal (${statusLabel})`
  }`;

  return (
    <SidebarHeader className="border-b border-sidebar-border/60 pb-3">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            render={<Link href="/" />}
            size="lg"
            tooltip={statusTooltip}
            className="group/logo hover:bg-sidebar-accent/60 transition-all rounded-xl p-2"
          >
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 group-hover/logo:scale-105 transition-transform">
              {isApproved ? (
                <Disc3 className="size-4 animate-[spin_8s_linear_infinite]" />
              ) : (
                <Music className="size-4" />
              )}
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-bold tracking-tight text-foreground text-sm">
                  {brandName}
                </span>
                {whiteLabel?.code && (
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] px-1 py-0 shrink-0 border-border/80"
                  >
                    {whiteLabel.code}
                  </Badge>
                )}
              </div>
              <span className="truncate text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {isApproved ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                      WhiteLabel Studio
                    </span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                    <span className="text-amber-600 dark:text-amber-400 font-medium capitalize truncate">
                      {statusLabel}
                    </span>
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
