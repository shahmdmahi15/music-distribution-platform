import { User } from "@/types/user";
import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { AdminSidebarHeader } from "./admin-sidebar-header";
import { AdminSidebarContent } from "./admin-sidebar-content";
import { AdminSidebarFooter } from "./admin-sidebar-footer";

export function AdminSidebar({ user }: { user: User }) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <AdminSidebarHeader />
      <AdminSidebarContent />
      <AdminSidebarFooter user={user} />
      <SidebarRail />
    </Sidebar>
  );
}
