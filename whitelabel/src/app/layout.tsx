import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TenantProvider } from "@/components/tenant-theme-provider";
import { Toaster } from "sonner";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { meAction } from "@/actions/auth/me.action";
import { UnconfiguredPortalView } from "@/components/unconfigured-portal-view";
import { getGoogleFontUrl, getFontFamilyCss } from "@/lib/fonts";

export async function generateMetadata(): Promise<Metadata> {
  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;

  if (!tenant || !tenant.isConfigured) {
    return {
      title: "WhiteLabel Setup Required | RoyalMotionIT",
      description:
        "This WhiteLabel portal installation is awaiting onboarding setup and initial configuration.",
    };
  }

  return {
    title: tenant.name
      ? `${tenant.name} | Music Portal`
      : "WhiteLabel Music Portal",
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
  const [tenantRes, meRes] = await Promise.all([getTenantAction(), meAction()]);

  const tenant = tenantRes.tenant || null;
  const user = meRes.user || null;
  const isSetupComplete = Boolean(
    tenant && tenantRes.success && tenant.isConfigured !== false,
  );

  const fontFamily =
    tenant?.theme?.fontFamily || tenant?.themeFont || "Inter";
  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";
  const accentColor =
    tenant?.theme?.accentColor || tenant?.accentColor || "#ec4899";
  const radius =
    tenant?.theme?.radius || tenant?.themeRadius || "0.5rem";
  const fontCss = getFontFamilyCss(fontFamily);
  const googleFontUrl = getGoogleFontUrl(fontFamily);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={googleFontUrl} />
        <style
          id="whitelabel-theme-root-vars"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --font-sans: ${fontCss};
                --font-heading: ${fontCss};
                --tenant-primary: ${primaryColor};
                --tenant-accent: ${accentColor};
                --tenant-radius: ${radius};
                --primary: ${primaryColor};
                --primary-foreground: #ffffff;
                --ring: ${primaryColor};
                --radius: ${radius};
              }
              html, body {
                font-family: ${fontCss} !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme={tenant?.theme?.mode || "dark"}
          enableSystem
          disableTransitionOnChange
        >
          {!isSetupComplete || !tenant ? (
            <>
              <UnconfiguredPortalView
                tenant={tenant}
                error={tenantRes.message}
                diagnostics={tenantRes.diagnostics}
              />
              <Toaster richColors position="top-right" />
            </>
          ) : (
            <TenantProvider tenant={tenant} user={user}>
              {children}
              <Toaster richColors position="top-right" />
            </TenantProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
