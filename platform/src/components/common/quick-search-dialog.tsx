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
import { Kbd } from "@/components/ui/kbd";
import {
  House,
  Disc3,
  Disc2,
  Tv,
  FileChartColumn,
  Server,
  HeartHandshake,
  Users,
  UserPen,
  ShieldPlus,
  Music,
  Code2,
  FileAudio,
  Radio,
  FileJson,
  Building2,
  Sparkles,
} from "lucide-react";

interface QuickSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function QuickSearchDialog({
  open,
  onOpenChange,
  isAdmin = false,
}: QuickSearchDialogProps) {
  const router = useRouter();

  const handleNavigate = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  const adminNav = [
    { title: "Overview Dashboard", url: "/admin", icon: House, category: "Navigation" },
    { title: "WhiteLabel Instances", url: "/admin/whitelabels", icon: Disc3, category: "Management" },
    { title: "Music Distribution Pipeline", url: "/admin/distribution", icon: Disc2, category: "Distribution" },
    { title: "VEVO Video Channels", url: "/admin/channels", icon: Tv, category: "Distribution" },
    { title: "Cloud Infrastructure & Fleets", url: "/admin/infrastructure", icon: Server, category: "Management" },
    { title: "Referrer & Affiliate Network", url: "/admin/referrers", icon: HeartHandshake, category: "Management" },
    { title: "Platform Users Directory", url: "/admin/users/platform", icon: Users, category: "Security" },
    { title: "Distribution Statements & Reports", url: "/admin/reports", icon: FileChartColumn, category: "Reporting" },
    { title: "Profile & System Settings", url: "/admin/profile", icon: UserPen, category: "Account" },
    { title: "Active Security Sessions", url: "/admin/sessions", icon: ShieldPlus, category: "Security" },
  ];

  const clientNav = [
    { title: "Tenant Portal Overview", url: "/", icon: House, category: "Portal" },
    { title: "WhiteLabel Command Center", url: "/whitelabel", icon: Building2, category: "WhiteLabel" },
    { title: "Catalog Submissions Review", url: "/whitelabel/catalog", icon: Music, category: "Catalog" },
    { title: "VEVO Channels Management", url: "/whitelabel/channels", icon: Tv, category: "Distribution" },
    { title: "Cloud Setup & BYOC Wizard", url: "/whitelabel/setup", icon: Server, category: "Infrastructure" },
    { title: "Profile & Identity Settings", url: "/profile", icon: UserPen, category: "Account" },
    { title: "Active Security Sessions", url: "/sessions", icon: ShieldPlus, category: "Security" },
  ];

  const navigationItems = isAdmin ? adminNav : clientNav;

  const quickActions = [
    {
      title: "Generate DDEX ERN 4.3 XML Feed",
      action: () => handleNavigate(isAdmin ? "/admin/distribution" : "/whitelabel/catalog"),
      icon: Code2,
      shortcut: "ERN43",
    },
    {
      title: "Inspect ACRCloud Audio Fingerprints",
      action: () => handleNavigate(isAdmin ? "/admin/distribution" : "/whitelabel/catalog"),
      icon: Radio,
      shortcut: "SCAN",
    },
    {
      title: "Audit AWS BYOC Multi-Cloud Telemetry",
      action: () => handleNavigate(isAdmin ? "/admin/infrastructure" : "/whitelabel/setup"),
      icon: Server,
      shortcut: "AWS",
    },
    {
      title: "Export DSP JSON Metadata Manifest",
      action: () => handleNavigate(isAdmin ? "/admin/distribution" : "/whitelabel/catalog"),
      icon: FileJson,
      shortcut: "JSON",
    },
  ];

  const sampleReleases = [
    { title: "Neon Horizon", code: "RM-REL-8821", artist: "Aura Sound", type: "SINGLE", url: isAdmin ? "/admin/distribution" : "/whitelabel/catalog" },
    { title: "Midnight Reverie", code: "RM-REL-7412", artist: "Kavinsky Lab", type: "ALBUM", url: isAdmin ? "/admin/distribution" : "/whitelabel/catalog" },
    { title: "Echoes in the Rain", code: "RM-REL-9104", artist: "Lunar Drift", type: "EP", url: isAdmin ? "/admin/distribution" : "/whitelabel/catalog" },
  ];

  const sampleTenants = [
    { name: "ANS Music Distribution", code: "ANS-DIST-01", domain: "backstage.ansmusic.com", url: "/admin/whitelabels" },
    { name: "Bengal Beats Worldwide", code: "BB-GLOBAL-02", domain: "backstage.bengalbeats.com", url: "/admin/whitelabels" },
    { name: "Motion Records International", code: "MRI-ENT-03", domain: "backstage.motionrecords.io", url: "/admin/whitelabels" },
  ];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Global Command Palette"
      description="Quickly navigate routes, inspect music releases, or trigger system actions"
      className="max-w-2xl"
    >
      <CommandInput placeholder="Search routes, releases, whiteLabels, or actions... (Press Esc to close)" />
      <CommandList className="max-h-[380px]">
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          No matching platform resources found.
        </CommandEmpty>

        {/* Navigation Routes */}
        <CommandGroup heading="Platform Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.url}
                onSelect={() => handleNavigate(item.url)}
                className="cursor-pointer text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-primary shrink-0" />
                  <span className="font-medium">{item.title}</span>
                </div>
                <CommandShortcut>
                  <Kbd className="text-[10px] h-4 font-mono">{item.category}</Kbd>
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Direct Platform Actions */}
        <CommandGroup heading="Platform Actions & Tooling">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <CommandItem
                key={action.title}
                onSelect={() => {
                  onOpenChange(false);
                  action.action();
                }}
                className="cursor-pointer text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-amber-500 shrink-0" />
                  <span>{action.title}</span>
                </div>
                <CommandShortcut>
                  <Kbd className="text-[10px] h-4 font-mono uppercase">{action.shortcut}</Kbd>
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Music Catalog Releases */}
        <CommandGroup heading="Recent Catalog Releases">
          {sampleReleases.map((rel) => (
            <CommandItem
              key={rel.code}
              onSelect={() => handleNavigate(rel.url)}
              className="cursor-pointer text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileAudio className="size-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-semibold">{rel.title}</span>
                  <span className="text-muted-foreground ml-1.5">• {rel.artist}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Kbd className="text-[9px] font-mono">{rel.code}</Kbd>
                <Kbd className="text-[9px] font-mono uppercase bg-primary/10 text-primary">{rel.type}</Kbd>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {isAdmin && (
          <>
            <CommandSeparator />
            {/* WhiteLabel Partners */}
            <CommandGroup heading="WhiteLabel Tenants">
              {sampleTenants.map((wl) => (
                <CommandItem
                  key={wl.code}
                  onSelect={() => handleNavigate(wl.url)}
                  className="cursor-pointer text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-blue-500 shrink-0" />
                    <div>
                      <span className="font-semibold">{wl.name}</span>
                      <span className="text-muted-foreground ml-1.5 text-[11px] font-mono">({wl.domain})</span>
                    </div>
                  </div>
                  <CommandShortcut>
                    <Kbd className="text-[9px] font-mono">{wl.code}</Kbd>
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/30 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Navigate with <Kbd className="text-[9px] h-4">↑</Kbd> <Kbd className="text-[9px] h-4">↓</Kbd></span>
          <span>Select with <Kbd className="text-[9px] h-4">↵</Kbd></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Close with <Kbd className="text-[9px] h-4">Esc</Kbd></span>
        </div>
      </div>
    </CommandDialog>
  );
}