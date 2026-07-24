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
} from "lucide-react";
import Link from "next/link";

const navigations = [
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
        title: "WhiteLabels",
        url: "#",
        icon: Disc3,
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
        title: "Users",
        url: "#",
        icon: Users,
        items: [
          {
            title: "Platform",
            url: "/admin/users/platform",
          },
          {
            title: "WhiteLabel",
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
            title: "All",
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
            title: "Process",
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
    name: "Analyticals",
    items: [
      {
        title: "Analytics",
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
            title: "Revenew",
            url: "#",
          },
          {
            title: "Geo",
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
            title: "Platform",
            url: "#",
          },
          {
            title: "WhiteLabel",
            url: "#",
          },
        ],
      },
    ],
  },
];

export function AdminSidebarContent() {
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
