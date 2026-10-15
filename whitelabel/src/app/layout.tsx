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

function sanitizeColor(val: string | undefined | null, fallback: string): string {
  if (!val) return fallback;
  const trimmed = val.trim();
  const isValid =
    /^#([0-9a-fA-F]{3,8})$/.test(trimmed) ||
    /^rgba?\([^<>"'{};]+\)$/.test(trimmed) ||
    /^hsla?\([^<>"'{};]+\)$/.test(trimmed) ||
    /^oklch\([^<>"'{};]+\)$/.test(trimmed);
  return isValid ? trimmed : fallback;
}

function sanitizeRadius(val: string | undefined | null, fallback = "0.5rem"): string {
  if (!val) return fallback;
  const trimmed = val.trim();
  const isValid = /^(\d+(\.\d+)?)(rem|px|em|%)$/.test(trimmed);
  return isValid ? trimmed : fallback;
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
  const primaryColor = sanitizeColor(
    tenant?.theme?.primaryColor || tenant?.primaryColor,
    "#6366f1",
  );
  const accentColor = sanitizeColor(
    tenant?.theme?.accentColor || tenant?.accentColor,
    "#ec4899",
  );
  const radius = sanitizeRadius(
    tenant?.theme?.radius || tenant?.themeRadius,
    "0.5rem",
  );
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
