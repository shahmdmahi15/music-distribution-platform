"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global portal error caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-5 max-w-lg mx-auto">
      <div className="p-3.5 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          An unexpected error occurred while rendering this page. You can try reloading or navigating back to your dashboard.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="sm"
          variant="outline"
          render={<Link href="/" />}
          className="gap-2 text-xs"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Button>
        <Button
          size="sm"
          onClick={() => reset()}
          className="gap-2 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Page</span>
        </Button>
      </div>
    </div>
  );
}
