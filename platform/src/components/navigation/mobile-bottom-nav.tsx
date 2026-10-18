"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useAdaptiveDevice } from "@/hooks/use-adaptive-device";
import {
  House,
  Disc3,
  Radio,
  FileBarChart,
  LayoutDashboard,
  Music,
  Menu,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const { isSmartphone, orientation } = useAdaptiveDevice();

  const isLandscapePhone = isSmartphone && orientation === "landscape";
  const isAdmin = pathname.startsWith("/admin");

  const adminNav = [
    { title: "Home", href: "/admin", icon: House },
    { title: "Catalog", href: "/admin/distribution", icon: Disc3 },
    { title: "VEVO", href: "/admin/channels", icon: Radio },
    { title: "Reports", href: "/admin/reports", icon: FileBarChart },
  ];

  const clientNav = [
    { title: "Home", href: "/", icon: House },
    { title: "WhiteLabel", href: "/whitelabel", icon: LayoutDashboard },
    { title: "Catalog", href: "/whitelabel/catalog", icon: Music },
    { title: "VEVO", href: "/whitelabel/channels", icon: Radio },
  ];

  const items = isAdmin ? adminNav : clientNav;

  return (
    <nav
      aria-label="Mobile Navigation"
      className={
        isLandscapePhone
          ? "sm:hidden fixed bottom-1 left-1/2 -translate-x-1/2 z-40 h-10 w-auto max-w-[92vw] px-3 py-1 bg-card/90 backdrop-blur-xl border border-border/80 shadow-2xl rounded-full flex items-center justify-center gap-1 transition-all duration-300"
          : "sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around transition-all duration-300"
      }
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex flex-col items-center justify-center ${
              isLandscapePhone
                ? "min-w-[44px] min-h-[36px] px-2 flex-row gap-1.5"
                : "min-w-[48px] min-h-[48px] px-1"
            } rounded-xl transition-all duration-200 touch-manipulation select-none active:scale-90 ${
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            }`}
          >
            {/* Glowing Active Indicator for Portrait */}
            {isActive && !isLandscapePhone && (
              <span className="absolute -top-1 w-6 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary,rgba(59,130,246,0.8))] animate-pulse" />
            )}

            <div
              className={`p-1 rounded-lg transition-transform duration-200 group-hover:scale-105 ${
                isActive
                  ? "bg-primary/15 text-primary shadow-xs ring-1 ring-primary/20"
                  : "bg-transparent"
              }`}
            >
              <Icon className={isLandscapePhone ? "w-4 h-4" : "w-5 h-5"} />
            </div>
            <span
              className={
                isLandscapePhone
                  ? "text-[11px] font-medium tracking-tight"
                  : "text-[10px] tracking-tight mt-0.5"
              }
            >
              {item.title}
            </span>
          </Link>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        onClick={toggleSidebar}
        type="button"
        aria-label="Toggle navigation drawer"
        className={`group relative flex flex-col items-center justify-center ${
          isLandscapePhone
            ? "min-w-[44px] min-h-[36px] px-2 flex-row gap-1.5"
            : "min-w-[48px] min-h-[48px] px-1"
        } rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-90 transition-all duration-200 touch-manipulation select-none cursor-pointer`}
      >
        <div className="p-1 rounded-lg transition-transform duration-200 group-hover:scale-105">
          <Menu className={isLandscapePhone ? "w-4 h-4" : "w-5 h-5"} />
        </div>
        <span
          className={
            isLandscapePhone
              ? "text-[11px] font-medium tracking-tight"
              : "text-[10px] tracking-tight mt-0.5"
          }
        >
          Menu
        </span>
      </button>
    </nav>
  );
}
