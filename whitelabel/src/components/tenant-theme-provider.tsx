"use client";

import React, { createContext, useContext, useEffect } from "react";
import { WhiteLabelTenant, WhiteLabelUser } from "@/types/user";
import { getGoogleFontUrl, getFontFamilyCss } from "@/lib/fonts";

interface TenantContextValue {
  tenant: WhiteLabelTenant | null;
  user: WhiteLabelUser | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  user: null,
});

export function TenantProvider({
  children,
  tenant,
  user,
}: {
  children: React.ReactNode;
  tenant: WhiteLabelTenant | null;
  user: WhiteLabelUser | null;
}) {
  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";
  const accentColor =
    tenant?.theme?.accentColor || tenant?.accentColor || "#ec4899";
  const radius =
    tenant?.theme?.radius || tenant?.themeRadius || "0.5rem";
  const fontFamily =
    tenant?.theme?.fontFamily || tenant?.themeFont || "Inter";
  const cardStyle =
    tenant?.theme?.cardStyle || tenant?.cardStyle || "modern";
  const navbarStyle =
    tenant?.theme?.navbarStyle || tenant?.navbarStyle || "glass";

  // Dynamically synchronize Google Font and root CSS variables on the client
  useEffect(() => {
    if (typeof document !== "undefined" && fontFamily) {
      // 1. Maintain Google Font <link> in document.head
      const linkId = "whitelabel-active-google-font";
      let link = document.getElementById(linkId) as HTMLLinkElement | null;
      const expectedHref = getGoogleFontUrl(fontFamily);
      if (!link) {
        link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== expectedHref) {
        link.href = expectedHref;
      }

      // 2. Synchronize :root CSS variables so all Radix portals & elements inherit
      const root = document.documentElement;
      const fontCss = getFontFamilyCss(fontFamily);
      root.style.setProperty("--font-sans", fontCss);
      root.style.setProperty("--font-heading", fontCss);
      root.style.setProperty("--tenant-primary", primaryColor);
      root.style.setProperty("--tenant-accent", accentColor);
      root.style.setProperty("--tenant-radius", radius);
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--primary-foreground", "#ffffff");
      root.style.setProperty("--ring", primaryColor);
      root.style.setProperty("--radius", radius);

      document.body.style.fontFamily = fontCss;
    }
  }, [fontFamily, primaryColor, accentColor, radius]);

  const fontCss = getFontFamilyCss(fontFamily);
  const styleVars = {
    "--tenant-primary": primaryColor,
    "--tenant-accent": accentColor,
    "--tenant-radius": radius,
    "--primary": primaryColor,
    "--primary-foreground": "#ffffff",
    "--ring": primaryColor,
    "--radius": radius,
    "--font-sans": fontCss,
    "--font-heading": fontCss,
    fontFamily: fontCss,
  } as React.CSSProperties;

  return (
    <TenantContext.Provider value={{ tenant, user }}>
      <div
        style={styleVars}
        data-card-style={cardStyle}
        data-navbar-style={navbarStyle}
        className="min-h-screen flex flex-col bg-background text-foreground antialiased"
      >
        {children}
      </div>
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  return context.tenant;
}

export function useCurrentUser() {
  const context = useContext(TenantContext);
  return context.user;
}

export function useTenantTheme() {
  const tenant = useTenant();
  return {
    primaryColor:
      tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1",
    accentColor:
      tenant?.theme?.accentColor || tenant?.accentColor || "#ec4899",
    radius:
      tenant?.theme?.radius || tenant?.themeRadius || "0.5rem",
    fontFamily:
      tenant?.theme?.fontFamily || tenant?.themeFont || "Inter",
    cardStyle:
      tenant?.theme?.cardStyle || tenant?.cardStyle || "modern",
    navbarStyle:
      tenant?.theme?.navbarStyle || tenant?.navbarStyle || "glass",
    mode:
      tenant?.theme?.mode || tenant?.themeMode || "dark",
  };
}
