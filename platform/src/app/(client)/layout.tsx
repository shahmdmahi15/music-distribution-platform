import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/client/sidebar/client-sidebar";
import { DashboardHeader } from "@/components/common/dashboard-header";
import { meAction } from "@/actions/auth/me.action";
import { clientGetCurrentSubscriptionAction } from "@/actions/client/subscription/client-get-current-subscription.action";
import { redirect } from "next/navigation";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [me, subscription] = await Promise.all([
    meAction(),
    clientGetCurrentSubscriptionAction(),
  ]);

  if (!me.success || !me.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarProvider>
        <ClientSidebar user={me.user} subscription={subscription.subscription} />
        <SidebarInset className="flex flex-col min-h-screen overflow-hidden">
          <DashboardHeader user={me.user} isAdmin={false} />
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
