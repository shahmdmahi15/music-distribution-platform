"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PaymentStatus, Subscription } from "@/types/subscription";
import { WhiteLabelStatus } from "@/types/whitelabel";
import {
  House,
  LayoutDashboard,
  UserPen,
  ShieldPlus,
  Sparkles,
  KeyRound,
  Webhook,
  Users,
  UserCheck,
} from "lucide-react";

interface SimpleNavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SimpleNavigationGroup {
  name: string;
  items: SimpleNavigationItem[];
}

// 1. Clean, focused navigation for Active WhiteLabel Clients
const activeNavigations: SimpleNavigationGroup[] = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: House,
      },
    ],
  },
  {
    name: "WhiteLabel",
    items: [
      {
        title: "Overview",
        url: "/whitelabel",
        icon: LayoutDashboard,
      },
      {
        title: "Setup Wizard",
        url: "/whitelabel/setup",
        icon: Sparkles,
      },
      {
        title: "Registration Policy",
        url: "/whitelabel/policy",
        icon: UserCheck,
      },
      {
        title: "Webhooks",
        url: "/whitelabel/webhooks",
        icon: Webhook,
      },
      {
        title: "API Keys",
        url: "/whitelabel/api-keys",
        icon: KeyRound,
      },
      {
        title: "Portal Users",
        url: "/whitelabel/users",
        icon: Users,
      },
    ],
  },
  {
    name: "Account",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: UserPen,
      },
      {
        title: "Active Sessions",
        url: "/sessions",
        icon: ShieldPlus,
      },
    ],
  },
];

// 2. Focused navigation for Active WhiteLabel Clients who have NOT yet completed the Setup Wizard
const setupPendingNavigations: SimpleNavigationGroup[] = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: House,
      },
    ],
  },
  {
    name: "WhiteLabel",
    items: [
      {
        title: "Setup Wizard",
        url: "/whitelabel/setup",
        icon: Sparkles,
      },
      {
        title: "Registration Policy",
        url: "/whitelabel/policy",
        icon: UserCheck,
      },
    ],
  },
  {
    name: "Account",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: UserPen,
      },
      {
        title: "Active Sessions",
        url: "/sessions",
        icon: ShieldPlus,
      },
    ],
  },
];

// 3. Simple, clean navigation for Onboarding Clients
const onboardingNavigations: SimpleNavigationGroup[] = [
  {
    name: "Platform",
    items: [
      {
        title: "Onboarding & Status",
        url: "/",
        icon: Sparkles,
      },
    ],
  },
  {
    name: "Account",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: UserPen,
      },
      {
        title: "Active Sessions",
        url: "/sessions",
        icon: ShieldPlus,
      },
    ],
  },
];

export function ClientSidebarContent({
  subscription,
}: {
  subscription?: Subscription;
}) {
  const pathname = usePathname();
  const payments = subscription?.payments ?? [];

  const isApprovedAndPaid =
    subscription?.whiteLabel?.status === WhiteLabelStatus.ACTIVE &&
    payments.some((p) => p.status === PaymentStatus.COMPLETED);

  const isSetupCompleted = Boolean(
    subscription?.whiteLabel?.isSetupComplete ||
      (subscription?.whiteLabel as { isSetupCompleted?: boolean } | undefined)
        ?.isSetupCompleted,
  );

  const navigations = !isApprovedAndPaid
    ? onboardingNavigations
    : isSetupCompleted
      ? activeNavigations
      : setupPendingNavigations;

  return (
    <SidebarContent>
      {navigations.map((group) => (
        <SidebarGroup key={group.name}>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
            {group.name}
          </SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive =
                item.url === "/" || item.url === "/whitelabel"
                  ? pathname === item.url
                  : pathname === item.url ||
                    pathname.startsWith(item.url + "/");

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    render={<Link href={item.url} />}
                    className={`transition-all duration-150 ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                        : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
