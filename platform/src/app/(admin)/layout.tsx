import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar/admin-sidebar";
import { DashboardHeader } from "@/components/common/dashboard-header";
import { meAction } from "@/actions/auth/me.action";
import { redirect } from "next/navigation";
import { Role } from "@/types/user";

/** Roles admitted to the admin realm. Mirrors the API's admin middleware. */
const ADMIN_ROLES: Role[] = [
  Role.OWNER,
  Role.ADMIN,
  Role.MANAGER,
  Role.STAFF,
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const res = await meAction();

  if (!res.success || !res.user) {
    redirect("/auth/login");
  }

  // Defence in depth: the API rejects cross-realm calls anyway, but a signed-in
  // CLIENT should never be handed the admin shell to begin with.
  if (!ADMIN_ROLES.includes(res.user.role)) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarProvider>
        <AdminSidebar user={res.user} />
        <SidebarInset className="flex flex-col min-h-screen overflow-hidden">
          <DashboardHeader user={res.user} isAdmin={true} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
            {/* Subtle background ambient mesh */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
