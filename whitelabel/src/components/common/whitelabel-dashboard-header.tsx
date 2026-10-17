"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { WhiteLabelQuickSearch } from "./whitelabel-quick-search";
import { useTenant } from "@/components/tenant-theme-provider";

const ROUTE_LABELS: Record<string, string> = {
  releases: "Catalog Releases",
  new: "New Release",
  channels: "VEVO Channels",
  reports: "Royalty Reports",
  contracts: "Split Contracts",
  users: "Users & Team",
  profile: "Profile",
  sessions: "Active Sessions",
};

export function WhiteLabelDashboardHeader() {
  const pathname = usePathname();
  const tenant = useTenant();
  const [quickSearchOpen, setQuickSearchOpen] = React.useState(false);

  // Generate breadcrumbs from route segments
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = React.useMemo(() => {
    if (segments.length === 0) {
      return [{ label: "Dashboard", href: "/", isLast: true }];
    }

    const items = [{ label: "Dashboard", href: "/", isLast: false }];
    let accumulated = "";

    segments.forEach((seg, idx) => {
      accumulated += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
      items.push({ label, href: accumulated, isLast });
    });

    return items;
  }, [segments]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/50 bg-background/95 px-4 backdrop-blur-md transition-[width,height] ease-linear">
        <div className="flex items-center gap-2 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* Dynamic Breadcrumbs */}
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast ? (
                      <BreadcrumbPage className="font-medium text-foreground">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Trigger */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickSearchOpen(true)}
            className="h-8 gap-2 px-2.5 text-xs text-muted-foreground hover:text-foreground bg-muted/30 border-border/60"
          >
            <Search className="size-3.5" />
            <span className="hidden md:inline-block">Quick Search...</span>
            <kbd className="pointer-events-none hidden h-4.5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Tenant Status Badge */}
          {tenant?.status && (
            <Badge
              variant="outline"
              className="hidden lg:inline-flex text-[10px] font-mono font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
            >
              {tenant.status}
            </Badge>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <WhiteLabelQuickSearch
        open={quickSearchOpen}
        onOpenChange={setQuickSearchOpen}
      />
    </>
  );
}
