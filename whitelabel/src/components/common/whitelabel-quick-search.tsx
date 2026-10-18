"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Music,
  PlusCircle,
  Radio,
  FileText,
  Scale,
  Users,
  User,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  category: "Navigation" | "Catalog" | "Operations" | "Financials" | "Team" | "Account";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: "dash", title: "Dashboard Overview", category: "Navigation", href: "/", icon: LayoutDashboard, shortcut: "G D" },
  { id: "rel-all", title: "All Releases Catalog", category: "Catalog", href: "/releases", icon: Music, shortcut: "G R" },
  { id: "rel-new", title: "Create New Music Release", category: "Catalog", href: "/releases/new", icon: PlusCircle, shortcut: "C R" },
  { id: "vevo", title: "VEVO Video Channels", category: "Operations", href: "/channels", icon: Radio, shortcut: "G V" },
  { id: "rep", title: "Royalty Reports & Statements", category: "Financials", href: "/reports", icon: FileText, shortcut: "G S" },
  { id: "splits", title: "Split Contracts & Agreements", category: "Financials", href: "/contracts", icon: Scale, shortcut: "G C" },
  { id: "team", title: "Team & User Directory", category: "Team", href: "/users", icon: Users, shortcut: "G U" },
  { id: "prof", title: "User Profile & Settings", category: "Account", href: "/profile", icon: User, shortcut: "G P" },
  { id: "sess", title: "Active Security Sessions", category: "Account", href: "/sessions", icon: Smartphone, shortcut: "G X" },
];

export function WhiteLabelQuickSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  // Global ⌘K keyboard listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const categories = ["Navigation", "Catalog", "Operations", "Financials", "Team", "Account"] as const;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Universal Navigation & Command Palette"
      description="Quickly navigate releases, channels, contracts, reports, and accounts..."
    >
      <CommandInput placeholder="Search catalog, channels, reports, contracts (⌘K)..." />
      <CommandList>
        <CommandEmpty>No matching portal action or destination found.</CommandEmpty>
        {categories.map((cat, idx) => {
          const items = SEARCH_ITEMS.filter((i) => i.category === cat);
          if (items.length === 0) return null;
          return (
            <React.Fragment key={cat}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={cat}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.category} ${item.href}`}
                      onSelect={() => handleSelect(item.href)}
                      className="cursor-pointer gap-2.5 py-2"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{item.title}</span>
                      {item.shortcut && (
                        <CommandShortcut className="font-mono text-[10px]">
                          {item.shortcut}
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </React.Fragment>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
