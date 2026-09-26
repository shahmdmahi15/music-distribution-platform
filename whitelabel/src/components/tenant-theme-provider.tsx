"use client";

import React, { createContext, useContext, useEffect } from "react";
import { WhiteLabelTenant, WhiteLabelUser } from "@/types/user";

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

  // Dynamically load Google Font if a specific font is configured
  useEffect(() => {
    if (typeof document !== "undefined" && fontFamily) {
      const activeFontId = `google-font-tenant-${fontFamily.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
      if (!document.getElementById(activeFontId)) {
        const link = document.createElement("link");
        link.id = activeFontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);

  const styleVars = {
    "--tenant-primary": primaryColor,
    "--tenant-accent": accentColor,
    "--tenant-radius": radius,
    "--primary": primaryColor,
    "--primary-foreground": "#ffffff",
    "--ring": primaryColor,
    "--radius": radius,
    "--font-sans": `'${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    "--font-heading": `'${fontFamily}', sans-serif`,
    fontFamily: `'${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
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
