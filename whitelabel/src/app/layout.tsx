import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TenantProvider } from "@/components/tenant-theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "sonner";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { meAction } from "@/actions/auth/me.action";
import { UnconfiguredPortalView } from "@/components/unconfigured-portal-view";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;

  if (!tenant) {
    return {
      title: "WhiteLabel Setup Incomplete | RoyalMotionIT",
      description:
        "This WhiteLabel portal installation is awaiting branding configuration and API authorization.",
    };
  }

  return {
    title: tenant.name ? `${tenant.name} | Music Portal` : "WhiteLabel Music Portal",
    description:
      tenant.description ||
      tenant.tagline ||
      "WhiteLabel Music Distribution & Rights Management Platform",
    icons: tenant.faviconUrl ? [{ url: tenant.faviconUrl }] : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tenantRes, meRes] = await Promise.all([
    getTenantAction(),
    meAction(),
  ]);

  const tenant = tenantRes.tenant || null;
  const user = meRes.user || null;
  const isSetupComplete = Boolean(
    tenant && tenantRes.success && tenant.isConfigured !== false
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {!isSetupComplete || !tenant ? (
            <UnconfiguredPortalView
              error={tenantRes.message}
              diagnostics={tenantRes.diagnostics}
            />
          ) : (
            <TenantProvider tenant={tenant} user={user}>
              <Navbar />
              <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
                {children}
              </main>
              <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
                {tenant.copyrightText ||
                  `© ${new Date().getFullYear()} ${tenant.name || "WhiteLabel"}. All rights reserved.`}
              </footer>
              <Toaster richColors position="top-right" />
            </TenantProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
