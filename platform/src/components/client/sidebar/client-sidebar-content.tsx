"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { PaymentStatus, Subscription } from "@/types/subscription";
import {
  ChevronRight,
  Disc3,
  Logs,
  CreditCard,
  House,
  UserPen,
  ShieldPlus,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 1. Navigation for Approved & Active WhiteLabel Tenants
const navigationsWithActiveWhiteLabel = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Management",
    items: [
      {
        title: "WhiteLabel",
        url: "#",
        icon: Disc3,
        items: [
          {
            title: "Identity & Branding",
            url: "/whitelabel/branding",
          },
          {
            title: "Theme Customizer",
            url: "/whitelabel/theme",
          },
          {
            title: "Domain & DNS",
            url: "/whitelabel/domain",
          },
          {
            title: "Credentials & SSO",
            url: "/whitelabel/sso",
          },
          {
            title: "API Keys",
            url: "/whitelabel/api-keys",
          },
          {
            title: "Webhooks",
            url: "/whitelabel/webhooks",
          },
          {
            title: "Portal Users",
            url: "/whitelabel/users",
          },
        ],
      },
    ],
  },

  {
    name: "Billing & Financials",

    items: [
      {
        title: "Transactions",
        url: "#",
        icon: CreditCard,
        items: [
          {
            title: "Invoices & Receipts",
            url: "#",
          },
          {
            title: "Payouts",
            url: "#",
          },
        ],
      },
    ],
  },
  {
    name: "Account & Security",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: UserPen,
        items: [],
      },
      {
        title: "Active Sessions",
        url: "/sessions",
        icon: ShieldPlus,
        items: [],
      },
      {
        title: "Audit Logs",
        url: "#",
        icon: Logs,
        items: [
          {
            title: "Activity Stream",
            url: "#",
          },
        ],
      },
    ],
  },
];

// 2. Navigation for Clients in Onboarding / Review
const navigationsOnboarding = [
  {
    name: "Application",
    items: [
      {
        title: "Onboarding & Status",
        url: "/",
        icon: Sparkles,
        items: [],
      },
    ],
  },
  {
    name: "Account & Security",
    items: [
      {
        title: "Profile",
        url: "/profile",
        icon: UserPen,
        items: [],
      },
      {
        title: "Active Sessions",
        url: "/sessions",
        icon: ShieldPlus,
        items: [],
      },
    ],
  },
];

import { useState } from "react";

interface NavigationSubItem {
  title: string;
  url: string;
}

interface NavigationItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavigationSubItem[];
}

function ClientCollapsibleMenuItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasActiveChild = item.items.some(
    (sub) => sub.url !== "#" && (pathname === sub.url || pathname.startsWith(sub.url)),
  );
  const [isOpen, setIsOpen] = useState(hasActiveChild);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
      render={
        <SidebarMenuItem>
          <CollapsibleTrigger
            render={
              <SidebarMenuButton
                tooltip={item.title}
                isActive={hasActiveChild}
                className={
                  hasActiveChild
                    ? "font-semibold text-sidebar-accent-foreground"
                    : ""
                }
              >
                {item.icon && (
                  <item.icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      hasActiveChild ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                )}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            }
          />
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => {
                const isSubActive =
                  subItem.url !== "#" &&
                  (pathname === subItem.url ||
                    pathname.startsWith(subItem.url));
                return (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      isActive={isSubActive}
                      className={
                        isSubActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                          : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-foreground"
                      }
                      render={
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      }
    />
  );
}

export function ClientSidebarContent({
  subscription,
}: {
  subscription?: Subscription;
}) {
  const pathname = usePathname();
  const payments = subscription?.payments ?? [];

  const isApprovedAndPaid =
    subscription?.whiteLabel?.status === "APPROVED" &&
    payments.some((p) => p.status === PaymentStatus.COMPLETED);

  const navigations = isApprovedAndPaid
    ? navigationsWithActiveWhiteLabel
    : navigationsOnboarding;

  return (
    <SidebarContent>
      {navigations.map((navigation, index) => (
        <SidebarGroup key={index}>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
            {navigation.name}
          </SidebarGroupLabel>
          <SidebarMenu>
            {navigation.items.map((item) => {
              const isActive =
                item.url !== "#" &&
                (pathname === item.url ||
                  (item.url !== "/" && pathname.startsWith(item.url)));

              return item.items.length === 0 ? (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    render={<Link href={item.url} />}
                    className={`transition-all duration-150 ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                        : "hover:bg-sidebar-accent/50"
                    }`}
                  >
                    {item.icon && (
                      <item.icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    )}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <ClientCollapsibleMenuItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
