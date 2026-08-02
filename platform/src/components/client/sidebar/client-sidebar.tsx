import { User } from "@/types/user";
import { Subscription } from "@/types/subscription";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { ClientSidebarHeader } from "./client-sidebar-header";
import { ClientSidebarContent } from "./client-sidebar-content";
import { ClientSidebarFooter } from "./client-sidebar-footer";

export function ClientSidebar({
  user,
  subscription,
}: {
  user: User;
  subscription?: Subscription;
}) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <ClientSidebarHeader />
      <ClientSidebarContent subscription={subscription} />
      <ClientSidebarFooter user={user} />
      <SidebarRail />
    </Sidebar>
  );
}
