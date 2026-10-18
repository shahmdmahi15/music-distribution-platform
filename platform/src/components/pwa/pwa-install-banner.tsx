"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, PlusSquare, X, Laptop } from "lucide-react";
import { RoyalMotionLogo } from "@/components/brand/royalmotion-logo";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type DetectedOS =
  | "ios"
  | "ipados"
  | "android"
  | "macos"
  | "windows"
  | "linux"
  | "unknown";

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [os, setOs] = useState<DetectedOS>("unknown");
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("rmit_pwa_install_dismissed");
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already running in standalone PWA mode
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      (window.navigator as any).standalone === true;

    if (standaloneMode) {
      setIsStandalone(true);
      setDismissed(true);
      return;
    }

    // Detect operating system accurately
    const ua = window.navigator.userAgent.toLowerCase();
    const navPlatform =
      (window.navigator as any).userAgentData?.platform?.toLowerCase() ||
      window.navigator.platform?.toLowerCase() ||
      "";

    const isIpad =
      /ipad/.test(ua) ||
      (navPlatform.includes("mac") && window.navigator.maxTouchPoints > 1);
    const isIphone = /iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(ua);
    const isWin = /win/.test(navPlatform) || /windows/.test(ua);
    const isMacOs =
      !isIpad && (/mac/.test(navPlatform) || /macintosh|mac os x/.test(ua));
    const isLinuxOs =
      !isAndroidDevice && (/linux/.test(navPlatform) || /linux/.test(ua));

    let detected: DetectedOS = "unknown";
    if (isIpad) detected = "ipados";
    else if (isIphone) detected = "ios";
    else if (isAndroidDevice) detected = "android";
    else if (isMacOs) detected = "macos";
    else if (isWin) detected = "windows";
    else if (isLinuxOs) detected = "linux";

    setOs(detected);

    if (isIphone || isIpad) {
      const timer = setTimeout(() => {
        setShowIosInstructions(true);
      }, 2500);
      return () => clearTimeout(timer);
    }

    // Listen for Chromium native beforeinstallprompt (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setDismissed(true);
      }
    } catch (err) {
      console.error("[PWA] Installation prompt failed:", err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rmit_pwa_install_dismissed", "true");
    }
  };

  if (dismissed || isStandalone) return null;

  const isDesktop = os === "macos" || os === "windows" || os === "linux";
  const osLabel =
    os === "macos"
      ? "macOS"
      : os === "windows"
      ? "Windows"
      : os === "linux"
      ? "Linux"
      : os === "android"
      ? "Android"
      : os === "ipados"
      ? "iPadOS"
      : os === "ios"
      ? "iOS"
      : "Desktop";

  // 1. Desktop (macOS, Windows, Linux) Chrome/Edge Install Banner
  if (isDesktop && deferredPrompt) {
    return (
      <aside
        aria-label="Desktop App Installation"
        className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-primary/25 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 ring-1 ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 p-1">
                <RoyalMotionLogo variant="icon" imageClassName="w-8 h-8" priority />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-foreground tracking-tight">
                    RoyalMotionIT for {osLabel}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20 uppercase tracking-wider">
                    {osLabel} App
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Native frameless desktop experience with window controls overlay & ultra-low latency.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/50"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/50 gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Laptop className="w-3.5 h-3.5 text-primary" />
              <span>Dedicated window & taskbar icon</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
              >
                Not now
              </Button>
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="text-xs h-8 px-3.5 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </Button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Android Native Install Prompt
  if (os === "android" && deferredPrompt) {
    return (
      <aside
        aria-label="Android App Installation"
        className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 ring-1 ring-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/60 border border-primary/20 flex items-center justify-center shrink-0 p-1">
              <RoyalMotionLogo variant="icon" imageClassName="w-8 h-8" priority />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Install RoyalMotionIT App
                </p>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                  Android
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                Fast mobile experience with background sync & offline catalog.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="text-xs h-8 px-3 font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  // 3. iOS & iPadOS Safari Step-by-Step Instructions
  if ((os === "ios" || os === "ipados") && showIosInstructions) {
    return (
      <aside
        aria-label="iOS App Installation Instructions"
        className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl p-4 shadow-2xl space-y-3 ring-1 ring-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <RoyalMotionLogo variant="icon" imageClassName="w-6 h-6" priority />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    Install on {osLabel}
                  </p>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/15 text-primary border border-primary/20">
                    {osLabel}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Add to Home Screen for fullscreen standalone mode
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-lg hover:bg-muted/50"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-foreground bg-muted/50 border border-border/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <span className="flex-1 text-[11px]">
                Tap the <strong>Share</strong> button in Safari toolbar
              </span>
              <Share2 className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              <span className="flex-1 text-[11px]">
                Scroll down and select <strong>Add to Home Screen</strong>
              </span>
              <PlusSquare className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                3
              </span>
              <span className="flex-1 text-[11px]">
                Confirm by tapping <strong>Add</strong> at top right
              </span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 4. Fallback for generic Chromium desktop when prompt is deferred
  if (deferredPrompt) {
    return (
      <aside
        aria-label="App Installation"
        className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Install RMIT Music App
              </p>
              <p className="text-[11px] text-muted-foreground">
                Offline access & standalone desktop speed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="text-xs h-8 px-3 font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Install
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
}
