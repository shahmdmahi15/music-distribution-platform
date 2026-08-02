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
} from "lucide-react";
import Link from "next/link";

const navigationsWithSubscriptionRunning = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Home",
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
            title: "Identity",
            url: "#",
          },
          {
            title: "Theme",
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
        title: "Domain",
        url: "#",
        icon: Globe,
        items: [
          {
            title: "Setup",
            url: "#",
          },
        ],
      },
      {
        title: "Credentials",
        url: "#",
        icon: FolderLock,
        items: [
          {
            title: "Setup",
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
            title: "Create",
            url: "#",
          },
          {
            title: "All",
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
            title: "Create",
            url: "#",
          },
          {
            title: "All",
            url: "#",
          },
        ],
      },
    ],
  },
  {
    name: "Billing & Payments",
    items: [
      {
        title: "Transactions",
        url: "#",
        icon: CreditCard,
        items: [
          {
            title: "Subscription",
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
    name: "Security",
    items: [
      {
        title: "Audit Logs",
        url: "#",
        icon: Logs,
        items: [
          {
            title: "All",
            url: "#",
          },
        ],
      },
    ],
  },
];

const navigationsWithSubscriptionNotStarted = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Home",
        url: "/",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Subscription",
    items: [
      {
        title: "Starting",
        url: "/starting",
        icon: House,
        items: [],
      },
    ],
  },
];

const navigationsWithoutSubscription = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Home",
        url: "/",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Subscription",
    items: [
      {
        title: "Subscribe",
        url: "/subscribe",
        icon: House,
        items: [],
      },
    ],
  },
];

const navigationsWithSubscriptionExpired = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Home",
        url: "/",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Subscription",
    items: [
      {
        title: "Renew",
        url: "/renew",
        icon: House,
        items: [],
      },
    ],
  },
];

const navigationsWithSuspendedSubscription = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Home",
        url: "/",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Suspension",
    items: [
      {
        title: "Reason",
        url: "/reason",
        icon: House,
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

  const noSubscription = !subscription || payments.length === 0;

  const isNotStarted =
    !noSubscription &&
    (firstPayment.startsAt > new Date() ||
      firstPayment.status !== PaymentStatus.COMPLETED);

  const isExpired = !noSubscription && firstPayment.endsAt < new Date();

  const isSuspended =
    !!subscription?.suspendedAt && subscription.suspendedAt > new Date();

  const navigations = noSubscription
    ? navigationsWithoutSubscription
    : isNotStarted
      ? navigationsWithSubscriptionNotStarted
      : isExpired
        ? navigationsWithSubscriptionExpired
        : isSuspended
          ? navigationsWithSuspendedSubscription
          : navigationsWithSubscriptionRunning;

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
                    className="flex items-center"
                  >
                    {item.icon && <item.icon />}
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
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
                            {item.icon && <item.icon />}
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
