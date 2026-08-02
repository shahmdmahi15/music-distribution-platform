import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ClientSidebar } from "@/components/client/sidebar/client-sidebar";
import { meAction } from "@/actions/auth/me.action";
import { clientGetCurrentSubscriptionAction } from "@/actions/client/subscription/client-get-current-subscription.action";

export default async function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [me, subscription] = await Promise.all([
    await meAction(),
    await clientGetCurrentSubscriptionAction(),
  ]);
  if (!me.success) return null;
  if (!me.user) return null;
  return (
    <div className="flex min-h-screen w-full">
      <SidebarProvider>
        <ClientSidebar user={me.user} subscription={subscription.subscription} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
            </div>
          </header>
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
