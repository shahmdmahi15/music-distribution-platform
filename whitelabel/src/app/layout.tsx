import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TenantProvider } from "@/components/tenant-theme-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { Toaster } from "sonner";
import { getTenantAction } from "@/actions/tenant/get-tenant.action";
import { meAction } from "@/actions/auth/me.action";
import { UnconfiguredPortalView } from "@/components/unconfigured-portal-view";
import { getGoogleFontUrl, getFontFamilyCss } from "@/lib/fonts";
import { getWCAGContrastForeground } from "@/lib/contrast";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const tenantRes = await getTenantAction();
  const tenant = tenantRes.tenant;
  const appTitle = tenant?.name || "Backstage";

  if (!tenant || !tenant.isConfigured) {
    return {
      title: "WhiteLabel Setup Required | RoyalMotionIT",
      description:
        "This WhiteLabel portal installation is awaiting onboarding setup and initial configuration.",
      manifest: "/manifest.json",
      appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "Backstage",
      },
      formatDetection: {
        telephone: false,
      },
      other: {
        "mobile-web-app-capable": "yes",
        "msapplication-TileColor": "#030712",
        "msapplication-tap-highlight": "no",
      },
      icons: {
        icon: [
          { url: "/favicon.ico" },
          { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
          { url: "/icon.svg", type: "image/svg+xml" },
        ],
        apple: [
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
      },
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
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: appTitle,
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "msapplication-TileColor": "#030712",
      "msapplication-tap-highlight": "no",
    },
    icons: tenant.faviconUrl
      ? [
          { url: tenant.faviconUrl },
          { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ]
      : [
          { url: "/favicon.ico" },
          { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
          { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
          { url: "/icon.svg", type: "image/svg+xml" },
          { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
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
  const primaryForeground = getWCAGContrastForeground(primaryColor);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Backstage" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#030712" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
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
                --primary-foreground: ${primaryForeground};
                --ring: ${primaryColor};
                --radius: ${radius};
                --sidebar-primary: ${primaryColor};
                --sidebar-primary-foreground: ${primaryForeground};
                --sidebar-ring: ${primaryColor};
              }
              .dark {
                --font-sans: ${fontCss};
                --font-heading: ${fontCss};
                --tenant-primary: ${primaryColor};
                --tenant-accent: ${accentColor};
                --tenant-radius: ${radius};
                --primary: ${primaryColor};
                --primary-foreground: ${primaryForeground};
                --ring: ${primaryColor};
                --radius: ${radius};
                --sidebar-primary: ${primaryColor};
                --sidebar-primary-foreground: ${primaryForeground};
                --sidebar-ring: ${primaryColor};
              }
              html, body {
                font-family: ${fontCss} !important;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
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
              <PwaRegister />
              <PwaInstallBanner />
              <Toaster richColors position="top-right" />
            </TenantProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
