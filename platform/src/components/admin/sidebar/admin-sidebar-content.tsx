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
import {
  Disc3,
  Users,
  ChevronRight,
  Folders,
  FileChartColumn,
  Logs,
  ChartNoAxesCombined,
  HeartHandshake,
  Blocks,
  Disc2,
  House,
  UserPen,
  ShieldPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigations = [
  {
    name: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/admin",
        icon: House,
        items: [],
      },
    ],
  },
  {
    name: "Management",
    items: [
      {
        title: "WhiteLabels",
        url: "#",
        icon: Disc3,
        items: [
          {
            title: "Instances & Vetting",
            url: "/admin/whitelabels",
          },
        ],
      },
      {
        title: "Users",
        url: "#",
        icon: Users,
        items: [
          {
            title: "Platform Users",
            url: "/admin/users/platform",
          },
          {
            title: "WhiteLabel Users",
            url: "/admin/users/whitelabel",
          },
        ],
      },
    ],
  },
  {
    name: "Distribution",
    items: [
      {
        title: "Assets",
        url: "#",
        icon: Blocks,
        items: [
          {
            title: "Tracks",
            url: "#",
          },
          {
            title: "Videos",
            url: "#",
          },
          {
            title: "Ringtones",
            url: "#",
          },
        ],
      },
      {
        title: "Releases",
        url: "#",
        icon: Disc2,
        items: [
          {
            title: "Digital Releases",
            url: "#",
          },
          {
            title: "Physical Releases",
            url: "#",
          },
        ],
      },
      {
        title: "Contributors",
        url: "#",
        icon: HeartHandshake,
        items: [
          {
            title: "Artists",
            url: "#",
          },
          {
            title: "Performers",
            url: "#",
          },
          {
            title: "Producers & Engineers",
            url: "#",
          },
          {
            title: "Writers",
            url: "#",
          },
          {
            title: "Publishers",
            url: "#",
          },
          {
            title: "Labels",
            url: "#",
          },
        ],
      },
    ],
  },
  {
    name: "Reporting",
    items: [
      {
        title: "Files",
        url: "#",
        icon: Folders,
        items: [
          {
            title: "Upload",
            url: "#",
          },
          {
            title: "All Files",
            url: "#",
          },
        ],
      },
      {
        title: "Reports",
        url: "#",
        icon: FileChartColumn,
        items: [
          {
            title: "Process Statements",
            url: "#",
          },
          {
            title: "All Reports",
            url: "#",
          },
        ],
      },
    ],
  },
  {
    name: "Analytics",
    items: [
      {
        title: "Telemetry",
        url: "#",
        icon: ChartNoAxesCombined,
        items: [
          {
            title: "Consumption",
            url: "#",
          },
          {
            title: "Engagement",
            url: "#",
          },
          {
            title: "Revenue",
            url: "#",
          },
          {
            title: "Geography",
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
        url: "/admin/profile",
        icon: UserPen,
        items: [],
      },
      {
        title: "Active Sessions",
        url: "/admin/sessions",
        icon: ShieldPlus,
        items: [],
      },
      {
        title: "Audit Logs",
        url: "#",
        icon: Logs,
        items: [
          {
            title: "Platform Logs",
            url: "#",
          },
          {
            title: "WhiteLabel Logs",
            url: "#",
          },
        ],
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

function AdminCollapsibleMenuItem({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const hasActiveChild = item.items.some(
    (sub) =>
      sub.url !== "#" && (pathname === sub.url || pathname.startsWith(sub.url)),
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

export function AdminSidebarContent() {
  const pathname = usePathname();

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
                  (item.url !== "/admin" && pathname.startsWith(item.url)));

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
                <AdminCollapsibleMenuItem
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
