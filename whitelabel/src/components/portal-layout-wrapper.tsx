import React from "react";
import { cookies } from "next/headers";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { WhiteLabelSidebar } from "@/components/sidebar/whitelabel-sidebar";
import { WhiteLabelDashboardHeader } from "@/components/common/whitelabel-dashboard-header";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { Globe, Mail, Phone } from "lucide-react";

export async function PortalLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;

  const socials = tenant?.socials || {};

  const socialLinks = [
    { name: "Instagram", url: socials.instagram },
    { name: "Twitter", url: socials.twitter },
    { name: "YouTube", url: socials.youtube },
    { name: "Spotify", url: socials.spotify },
    { name: "Facebook", url: socials.facebook },
    { name: "LinkedIn", url: socials.linkedin },
    { name: "TikTok", url: socials.tiktok },
  ].filter((s) => Boolean(s.url && s.url.trim()));

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <WhiteLabelSidebar />
      <SidebarInset>
        <WhiteLabelDashboardHeader />
        <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8 py-8 pb-24 sm:pb-8">
          {children}
        </main>
        <footer className="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/30 mt-auto">
          <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span>
                {tenant?.copyrightText ||
                  `© ${new Date().getFullYear()} ${tenant?.name || "WhiteLabel"}. All rights reserved.`}
              </span>
              {tenant?.country && (
                <span className="hidden sm:inline-block text-muted-foreground/60">
                  •
                </span>
              )}
              {tenant?.country && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <Globe className="w-3 h-3 text-muted-foreground" />
                  <span>{tenant.country}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.url!}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground transition-colors font-medium text-[11px]"
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
              )}

              {/* Support contact info */}
              {tenant?.supportEmail && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`mailto:${tenant.supportEmail}`}
                    className="hover:text-foreground underline underline-offset-2"
                  >
                    {tenant.supportEmail}
                  </a>
                </span>
              )}

              {tenant?.supportPhone && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <a
                    href={`tel:${tenant.supportPhone}`}
                    className="hover:text-foreground"
                  >
                    {tenant.supportPhone}
                  </a>
                </span>
              )}
            </div>
          </div>
        </footer>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
