import { User } from "@/types/user";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { ClientSidebarHeader } from "./client-sidebar-header";
import { ClientSidebarContent } from "./client-sidebar-content";
import { ClientSidebarFooter } from "./client-sidebar-footer";

export function RootSidebar({ user }: { user: User }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <ClientSidebarHeader />
      <ClientSidebarContent />
      <ClientSidebarFooter user={user} />
      <SidebarRail />
    </Sidebar>
  );
}
