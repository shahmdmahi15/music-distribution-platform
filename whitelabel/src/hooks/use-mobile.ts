"use client";

import * as React from "react";

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();

    window.addEventListener("resize", checkMobile);

    if (typeof window.matchMedia === "function") {
      try {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        if (mql) {
          if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", checkMobile);
            return () => {
              mql.removeEventListener("change", checkMobile);
              window.removeEventListener("resize", checkMobile);
            };
          } else if (typeof (mql as any).addListener === "function") {
            (mql as any).addListener(checkMobile);
            return () => {
              (mql as any).removeListener(checkMobile);
              window.removeEventListener("resize", checkMobile);
            };
          }
        }
      } catch {
        // Fall back to window resize listener
      }
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export const useMobile = useIsMobile;
