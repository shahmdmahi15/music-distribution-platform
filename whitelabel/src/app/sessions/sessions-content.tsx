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

export function SessionsContent() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

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
    let active = true;
    getSessionsAction()
      .then((res) => {
        if (!active) return;
        if (res.success && res.sessions) {
          setSessions(res.sessions);
        } else {
          toast.error(res.message);
        }
      })
      .catch(() => {
        if (active) toast.error("Failed to load active sessions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
      } else {
        toast.error(res.message);
      }
    });
  };

  const getDeviceIcon = (ua?: string | null) => {
    if (!ua) return <Monitor className="h-4 w-4" />;
    const lower = ua.toLowerCase();
    if (
      lower.includes("mobi") ||
      lower.includes("android") ||
      lower.includes("iphone")
    ) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (
      lower.includes("mac") ||
      lower.includes("windows") ||
      lower.includes("linux")
    ) {
      return <Laptop className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

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
            Manage your authenticated browser and mobile sessions across this
            portal.
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
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={isPending}
              className="text-xs gap-1.5 h-8.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Revoke All Others</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sessions Table Card */}
      <Card className="border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Connected Devices ({sessions.length})
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              Session Tokens Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No active sessions detected.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs">
                    Device &amp; Browser
                  </TableHead>
                  <TableHead className="text-xs">Network IP</TableHead>
                  <TableHead className="text-xs">Last Activity</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id || session.code}
                    className="border-border/50 text-xs"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-muted/60 text-foreground shrink-0">
                          {getDeviceIcon(session.userAgent)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            <span className="truncate max-w-[220px]">
                              {session.userAgent || "Unknown Device"}
                            </span>
                            {session.isCurrent && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-sans"
                              >
                                Current Device
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ID: {session.code}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {session.ipAddress || "—"}
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
                        <span className="text-[11px] text-muted-foreground italic">
                          Active session
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
