"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import {
  House,
  Disc3,
  Radio,
  FileBarChart,
  Menu,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const navItems = [
    { title: "Home", href: "/", icon: House },
    { title: "Releases", href: "/releases", icon: Disc3 },
    { title: "VEVO", href: "/channels", icon: Radio },
    { title: "Reports", href: "/reports", icon: FileBarChart },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-around"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl transition-all ${
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                isActive ? "bg-primary/10" : "bg-transparent"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight">{item.title}</span>
          </Link>
        );
      })}

      <button
        onClick={toggleSidebar}
        type="button"
        aria-label="Toggle navigation drawer"
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl text-muted-foreground hover:text-foreground active:scale-95 transition-all"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight">Menu</span>
      </button>
    </nav>
  );
}
