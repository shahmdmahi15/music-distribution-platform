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
  Webhook,
  ChevronRight,
  Disc3,
  KeyRound,
  Logs,
  Globe,
  CreditCard,
  FolderLock,
  House,
  UserPen,
  ShieldPlus,
  FileText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

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
            url: "#",
          },
        ],
      },
    ],
  },
  {
    name: "Developer",
    items: [
      {
        title: "Domain & DNS",
        url: "#",
        icon: Globe,
        items: [
          {
            title: "Custom Domain",
            url: "#",
          },
        ],
      },
      {
        title: "Credentials & SSO",
        url: "#",
        icon: FolderLock,
        items: [
          {
            title: "Auth Providers",
            url: "#",
          },
        ],
      },
      {
        title: "API Keys",
        url: "#",
        icon: KeyRound,
        items: [
          {
            title: "Generate Key",
            url: "#",
          },
          {
            title: "All Keys",
            url: "#",
          },
        ],
      },
      {
        title: "Webhooks",
        url: "#",
        icon: Webhook,
        items: [
          {
            title: "Configure",
            url: "#",
          },
          {
            title: "Event Logs",
            url: "#",
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

export function ClientSidebarContent({
  subscription,
}: {
  subscription?: Subscription;
}) {
  const payments = subscription?.payments ?? [];
  const firstPayment = payments[0];

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
          <SidebarGroupLabel>{navigation.name}</SidebarGroupLabel>
          <SidebarMenu>
            {navigation.items.map((item) =>
              item.items.length === 0 ? (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    render={<Link href={item.url} />}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <Collapsible
                  key={item.title}
                  className="group/collapsible"
                  render={
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        }
                      />
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                render={
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                }
                              />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  }
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </SidebarContent>
  );
}
