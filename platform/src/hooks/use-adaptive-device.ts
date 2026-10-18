"use client";

import * as React from "react";

export type DeviceClass = "smartphone" | "tablet" | "notebook" | "desktop" | "tv";
export type DeviceOrientation = "portrait" | "landscape";

export interface AdaptiveDeviceInfo {
  deviceClass: DeviceClass;
  orientation: DeviceOrientation;
  isTouch: boolean;
  isStandalone: boolean;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmartphone: boolean;
  isTablet: boolean;
  isNotebook: boolean;
  isDesktop: boolean;
  isTv: boolean;
}

const SERVER_SNAPSHOT: AdaptiveDeviceInfo = {
  deviceClass: "desktop",
  orientation: "landscape",
  isTouch: false,
  isStandalone: false,
  screenWidth: 1440,
  screenHeight: 900,
  isMobile: false,
  isPortrait: false,
  isLandscape: true,
  isSmartphone: false,
  isTablet: false,
  isNotebook: false,
  isDesktop: true,
  isTv: false,
};

function getDeviceClass(width: number, ua = ""): DeviceClass {
  const isTvAgent = /tv|smarttv|googletv|appletv|android tv|crkey|tizen|webos|hbbtv/i.test(ua);
  if (isTvAgent || width > 2560) return "tv";
  if (width < 640) return "smartphone";
  if (width < 1024) return "tablet";
  if (width < 1440) return "notebook";
  return "desktop";
}

let cachedSnapshot: AdaptiveDeviceInfo | null = null;

function getClientSnapshot(): AdaptiveDeviceInfo {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const orientation: DeviceOrientation = screenWidth >= screenHeight ? "landscape" : "portrait";
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const deviceClass = getDeviceClass(screenWidth, ua);
  const isTouch = Boolean(
    (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) ||
      (typeof navigator !== "undefined" && "maxTouchPoints" in navigator && navigator.maxTouchPoints > 0)
  );
  const isStandalone = Boolean(
    (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      (typeof navigator !== "undefined" && (navigator as unknown as { standalone?: boolean }).standalone)
  );
  const isMobile = screenWidth < 768;

  if (
    cachedSnapshot &&
    cachedSnapshot.screenWidth === screenWidth &&
    cachedSnapshot.screenHeight === screenHeight &&
    cachedSnapshot.orientation === orientation &&
    cachedSnapshot.deviceClass === deviceClass &&
    cachedSnapshot.isTouch === isTouch &&
    cachedSnapshot.isStandalone === isStandalone &&
    cachedSnapshot.isMobile === isMobile
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = {
    deviceClass,
    orientation,
    isTouch,
    isStandalone,
    screenWidth,
    screenHeight,
    isMobile,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape",
    isSmartphone: deviceClass === "smartphone",
    isTablet: deviceClass === "tablet",
    isNotebook: deviceClass === "notebook",
    isDesktop: deviceClass === "desktop",
    isTv: deviceClass === "tv",
  };

  return cachedSnapshot;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("resize", callback, { passive: true });
  window.addEventListener("orientationchange", callback, { passive: true });

  let touchMql: MediaQueryList | null = null;
  let standaloneMql: MediaQueryList | null = null;

  if (typeof window.matchMedia === "function") {
    touchMql = window.matchMedia("(pointer: coarse)");
    touchMql.addEventListener?.("change", callback);

    standaloneMql = window.matchMedia("(display-mode: standalone)");
    standaloneMql.addEventListener?.("change", callback);
  }

  return () => {
    window.removeEventListener("resize", callback);
    window.removeEventListener("orientationchange", callback);
    touchMql?.removeEventListener?.("change", callback);
    standaloneMql?.removeEventListener?.("change", callback);
  };
}

export function useAdaptiveDevice(): AdaptiveDeviceInfo {
  return React.useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => SERVER_SNAPSHOT
  );
}
