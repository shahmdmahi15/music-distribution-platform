"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { getSessionsAction } from "@/actions/session/get-sessions.action";
import {
  revokeSessionAction,
  revokeOtherSessionsAction,
} from "@/actions/session/revoke-session.action";
import { SessionItem } from "@/types/user";
import {
  Smartphone,
  Laptop,
  Monitor,
  ShieldCheck,
  RefreshCw,
  Clock,
  Trash2,
  Globe,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function SessionsContent() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showRevokeOthersDialog, setShowRevokeOthersDialog] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSessionsAction();
      if (res.success && res.sessions) {
        setSessions(res.sessions);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to load active sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = (code: string) => {
    startTransition(async () => {
      const res = await revokeSessionAction(code);
      if (res.success) {
        toast.success(res.message);
        setSessions((prev) => prev.filter((s) => s.code !== code));
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleRevokeOthers = () => {
    startTransition(async () => {
      const res = await revokeOtherSessionsAction();
      if (res.success) {
        toast.success(res.message);
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        setShowRevokeOthersDialog(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  // User-Agent parser into clean device & browser label
  const parseUserAgent = (ua?: string | null) => {
    if (!ua) {
      return {
        label: "Unknown Device",
        isMobile: false,
        os: "Unknown",
        browser: "Browser",
      };
    }

    const lower = ua.toLowerCase();

    // OS detection
    let os = "Desktop";
    let isMobile = false;
    if (lower.includes("iphone") || lower.includes("ipad")) {
      os = "iOS";
      isMobile = true;
    } else if (lower.includes("android")) {
      os = "Android";
      isMobile = true;
    } else if (lower.includes("macintosh") || lower.includes("mac os x")) {
      os = "macOS";
    } else if (lower.includes("windows")) {
      os = "Windows";
    } else if (lower.includes("linux")) {
      os = "Linux";
    } else if (lower.includes("cros")) {
      os = "ChromeOS";
    }

    // Browser detection
    let browser = "Web";
    if (lower.includes("edg/")) {
      browser = "Edge";
    } else if (lower.includes("chrome") && !lower.includes("edg/")) {
      browser = "Chrome";
    } else if (lower.includes("safari") && !lower.includes("chrome")) {
      browser = "Safari";
    } else if (lower.includes("firefox")) {
      browser = "Firefox";
    } else if (lower.includes("opera") || lower.includes("opr/")) {
      browser = "Opera";
    }

    return {
      label: `${os} • ${browser}`,
      isMobile,
      os,
      browser,
    };
  };

  const getDeviceIcon = (isMobile: boolean) => {
    return isMobile ? (
      <Smartphone className="h-4 w-4 text-primary" />
    ) : (
      <Laptop className="h-4 w-4 text-primary" />
    );
  };

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
        <div>
          <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <span>Active Device Sessions</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time inspection and authorization control for all devices signed into your portal account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={loading || isPending}
            className="text-xs gap-1.5 h-8.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          {otherSessionsCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRevokeOthersDialog(true)}
              disabled={isPending}
              className="text-xs gap-1.5 h-8.5 font-semibold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Revoke Other Sessions ({otherSessionsCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sessions Table Card */}
      <Card className="border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Connected Sessions ({sessions.length})
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
              Live JWT Auth Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <Empty className="py-12 px-4 border-0">
              <EmptyMedia>
                <Monitor className="h-8 w-8 text-muted-foreground/50" />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-sm font-semibold">No active sessions detected</EmptyTitle>
                <EmptyDescription className="text-xs text-muted-foreground">
                  No other active device or browser sessions were found for your account.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs">Device &amp; Browser</TableHead>
                  <TableHead className="text-xs">Network IP</TableHead>
                  <TableHead className="text-xs">Session Status</TableHead>
                  <TableHead className="text-xs">Last Activity</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const parsed = parseUserAgent(session.userAgent);

                  return (
                    <TableRow
                      key={session.id || session.code}
                      className="border-border/50 text-xs"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-muted/60 text-foreground shrink-0 border border-border/50">
                            {getDeviceIcon(parsed.isMobile)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              <span className="text-xs">{parsed.label}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] block">
                              {session.userAgent || "Unknown UA"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-muted/30">
                          <Globe className="w-3 h-3 mr-1 text-muted-foreground" />
                          <span>{session.ipAddress || "127.0.0.1"}</span>
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {session.isCurrent ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 gap-1.5 font-semibold text-[10px]">
                            {/* Emerald heartbeat dot */}
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>This Device</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                            ID: {session.code.slice(0, 8)}...
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {session.accessedAt
                              ? new Date(session.accessedAt).toLocaleString()
                              : "Recent"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {session.isCurrent ? (
                          <span className="text-[11px] text-emerald-500 font-semibold italic">
                            Current session
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevoke(session.code)}
                            disabled={isPending}
                            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Revoke All Other Sessions Confirmation Dialog */}
      <Dialog open={showRevokeOthersDialog} onOpenChange={setShowRevokeOthersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span>Revoke All Other Device Sessions</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              This will immediately sign out all <strong className="text-foreground">{otherSessionsCount}</strong> other active browsers and mobile devices. Your current session on this device will remain authenticated and active.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeOthersDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRevokeOthers}
              disabled={isPending}
              className="gap-1.5 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Revocation</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
