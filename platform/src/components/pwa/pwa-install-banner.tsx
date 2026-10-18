"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, PlusSquare, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in session
    if (typeof window === "undefined") return;
    const isDismissed = sessionStorage.getItem("rmit_pwa_install_dismissed");
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setDismissed(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener,
    );

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;

    if (isIosDevice && !isStandalone) {
      setIsIos(true);
      // Show iOS prompt after brief delay
      const timer = setTimeout(() => {
        setShowIosPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rmit_pwa_install_dismissed", "true");
    }
  };

  if (dismissed) return null;

  // Native Android/Chromium Install Prompt
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card/95 backdrop-blur-md border border-primary/30 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Install RMIT Platform App
              </p>
              <p className="text-[11px] text-muted-foreground">
                Fast, responsive desktop & mobile experience with offline support.
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
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari Install Instruction Card
  if (isIos && showIosPrompt) {
    return (
      <div className="fixed bottom-16 left-4 right-4 sm:hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl p-4 shadow-2xl space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <p className="text-xs font-semibold text-foreground">
                Install RMIT on iPhone / iPad
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Install this web app on your home screen for full-screen native
            performance:
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-foreground bg-muted/60 p-2 rounded-xl">
            <span>1. Tap Share</span>
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>2. Select Add to Home Screen</span>
            <PlusSquare className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
