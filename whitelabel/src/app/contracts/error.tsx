"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ContractsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contracts page error boundary caught an exception:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 max-w-xl mx-auto my-8">
      <div className="p-3 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-foreground">
          Unable to Load Rights &amp; Split Contracts
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          {error?.message && !error.message.includes("digest")
            ? error.message
            : "A temporary network or authentication error occurred while retrieving contracts. Please try again."}
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button
          size="sm"
          onClick={() => reset()}
          className="gap-2 text-xs font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reload Contracts</span>
        </Button>
      </div>
    </div>
  );
}
