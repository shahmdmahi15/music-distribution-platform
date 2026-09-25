"use client";

import React from "react";
import { Music } from "lucide-react";
import { WhiteLabelTenant } from "@/types/user";
import { cn } from "@/lib/utils";

interface TenantLogoProps {
  tenant: WhiteLabelTenant | null | undefined;
  className?: string;
  fallbackIconClassName?: string;
  fallbackContainerClassName?: string;
}

export function TenantLogo({
  tenant,
  className = "h-8 w-auto object-contain rounded",
  fallbackIconClassName = "w-5 h-5",
  fallbackContainerClassName = "h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm",
}: TenantLogoProps) {
  const logoLight = tenant?.logoUrl;
  const logoDark = tenant?.logoDarkUrl;
  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  // Case 1: Both light and dark logos are configured
  if (logoLight && logoDark) {
    return (
      <div className="relative inline-flex items-center">
        {/* Light theme logo */}
        <img
          src={logoLight}
          alt={tenant?.name || "Logo"}
          className={cn(className, "block dark:hidden")}
        />
        {/* Dark theme logo */}
        <img
          src={logoDark}
          alt={tenant?.name || "Logo"}
          className={cn(className, "hidden dark:block")}
        />
      </div>
    );
  }

  // Case 2: Only dark mode logo is configured
  if (logoDark && !logoLight) {
    return (
      <img
        src={logoDark}
        alt={tenant?.name || "Logo"}
        className={cn(className, "block")}
      />
    );
  }

  // Case 3: Only primary (light) logo is configured
  if (logoLight) {
    return (
      <img
        src={logoLight}
        alt={tenant?.name || "Logo"}
        className={cn(className, "block")}
      />
    );
  }

  // Case 4: No logo configured - use brand-colored fallback icon
  return (
    <div
      className={fallbackContainerClassName}
      style={{ backgroundColor: primaryColor }}
    >
      <Music className={fallbackIconClassName} />
    </div>
  );
}
