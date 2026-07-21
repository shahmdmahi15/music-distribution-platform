import { Sidebar, SidebarRail } from "@/components/ui/sidebar";
import { RootSidebarHeader } from "./root-sidebar-header";
import { RootSidebarContent } from "./root-sidebar-content";
import { RootSidebarFooter } from "./root-sidebar-footer";

export function RootSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <RootSidebarHeader />
      <RootSidebarContent />
      <RootSidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
