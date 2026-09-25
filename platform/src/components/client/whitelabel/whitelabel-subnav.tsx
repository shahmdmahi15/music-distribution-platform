"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WhiteLabelSubNavProps {
  tenantName?: string;
  tenantCode?: string;
  subdomain?: string | null;
  customDomain?: string | null;
}

export function WhiteLabelSubNav({
  tenantName,
  tenantCode,
  subdomain,
  customDomain,
}: WhiteLabelSubNavProps) {
  const portalUrl = customDomain
    ? `https://${customDomain}`
    : subdomain
      ? `https://${subdomain}.rmitdistribution.com`
      : "https://platform.royalmotionit.com";

  return (
    <div className="mb-6">
      {/* Enterprise Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {tenantName || "WhiteLabel Console"}
            </h1>
            {tenantCode && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/80">
                {tenantCode}
              </span>
            )}
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Configure platform branding, authoritative domain routing, API
            integration keys, and staff access.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            render={<a href={portalUrl} target="_blank" rel="noreferrer" />}
            variant="outline"
            size="sm"
            className="text-xs font-semibold gap-1.5 h-9 bg-background hover:bg-muted border-border/80 text-foreground shadow-xs"
          >
            <span>Open Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
