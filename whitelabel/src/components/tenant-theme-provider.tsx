"use client";

import React, { createContext, useContext } from "react";
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
  const radius = tenant?.theme?.radius || "0.5rem";

  return (
    <TenantContext.Provider value={{ tenant, user }}>
      <div
        style={
          {
            "--tenant-primary": primaryColor,
            "--tenant-accent": accentColor,
            "--tenant-radius": radius,
            "--primary": primaryColor,
            "--radius": radius,
          } as React.CSSProperties
        }
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
