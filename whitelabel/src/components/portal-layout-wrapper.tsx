import React from "react";
import { Navbar } from "@/components/navbar";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";

export async function PortalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground bg-card/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {tenant?.copyrightText ||
              `© ${new Date().getFullYear()} ${tenant?.name || "WhiteLabel"}. All rights reserved.`}
          </span>
          {tenant?.supportEmail && (
            <span className="text-muted-foreground">
              Support:{" "}
              <a
                href={`mailto:${tenant.supportEmail}`}
                className="hover:text-foreground underline underline-offset-2"
              >
                {tenant.supportEmail}
              </a>
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
