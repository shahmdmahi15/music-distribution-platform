"use client";

import { useState, useMemo } from "react";
import { UAParser } from "ua-parser-js";
import { Session } from "@/types/session";
import { clientRevokeSessionAction } from "@/actions/client/session/client-revoke-session.action";
import { clientRevokeAllOtherSessionsAction } from "@/actions/client/session/client-revoke-all-other-sessions.action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Search,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Clock,
  Calendar,
  RefreshCw,
  Info,
  Terminal,
  Trash2,
} from "lucide-react";

interface ClientSessionListProps {
  sessions: Session[];
  currentSessionId?: string;
}

interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop" | "unknown";
  raw: string;
}

function parseUserAgent(uaString: string | null): ParsedUserAgent {
  if (!uaString) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      deviceType: "unknown",
      raw: "No User Agent String",
    };
  }

  const parser = new UAParser(uaString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const browserName = browser.name
    ? `${browser.name}${browser.version ? ` ${browser.version}` : ""}`
    : "Unknown Browser";

  const osName = os.name
    ? `${os.name}${os.version ? ` ${os.version}` : ""}`
    : "Unknown OS";

  let deviceType: "mobile" | "tablet" | "desktop" | "unknown" = "desktop";
  if (device.type === "mobile") {
    deviceType = "mobile";
  } else if (device.type === "tablet") {
    deviceType = "tablet";
  } else if (!device.type) {
    const osLower = (os.name || "").toLowerCase();
    if (osLower.includes("android") || osLower.includes("ios")) {
      deviceType = "mobile";
    }
  }

  return {
    browser: browserName,
    os: osName,
    deviceType,
    raw: uaString,
  };
}

function formatDate(dateValue: string | Date | null | undefined) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSessionStatus(session: Session): "active" | "revoked" | "expired" {
  if (session.revokedAt) {
    return "revoked";
  }
  const expiresAt = new Date(session.expiresAt);
  if (!isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
    return "expired";
  }
  return "active";
}

export function ClientSessionList({
  sessions,
  currentSessionId,
}: ClientSessionListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "revoked" | "expired"
  >("all");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Revoke state
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(
    null,
  );
  const [isRevokingSingle, setIsRevokingSingle] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAllOthers, setIsRevokingAllOthers] = useState(false);

  // Filtered & sorted sessions (current session stays on top)
  const filteredSessions = useMemo(() => {
    const filtered = sessions.filter((session) => {
      const status = getSessionStatus(session);
      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const ua = parseUserAgent(session.userAgent);
      const ip = (session.ipAddress || "").toLowerCase();

      return (
        ip.includes(query) ||
        ua.browser.toLowerCase().includes(query) ||
        ua.os.toLowerCase().includes(query) ||
        ua.raw.toLowerCase().includes(query) ||
        session.id.toLowerCase().includes(query)
      );
    });

    if (currentSessionId) {
      return [...filtered].sort((a, b) => {
        if (a.id === currentSessionId) return -1;
        if (b.id === currentSessionId) return 1;
        return 0;
      });
    }

    return filtered;
  }, [sessions, statusFilter, searchQuery, currentSessionId]);

  const counts = useMemo(() => {
    let active = 0;
    let revoked = 0;
    let expired = 0;

    sessions.forEach((session) => {
      const status = getSessionStatus(session);
      if (status === "active") active++;
      else if (status === "revoked") revoked++;
      else if (status === "expired") expired++;
    });

    return {
      all: sessions.length,
      active,
      revoked,
      expired,
    };
  }, [sessions]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success("IP address copied to clipboard");
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleRevokeSingle = async () => {
    if (!revokingSessionId) return;
    if (currentSessionId && revokingSessionId === currentSessionId) {
      toast.error("Current session cannot be revoked.");
      setRevokingSessionId(null);
      return;
    }
    try {
      setIsRevokingSingle(true);
      const res = await clientRevokeSessionAction(revokingSessionId);
      if (res.success) {
        toast.success(res.message || "Session revoked successfully");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to revoke session");
      }
    } catch (error) {
      console.error("Error revoking session:", error);
      toast.error("Internal server error while revoking session");
    } finally {
      setIsRevokingSingle(false);
      setRevokingSessionId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    try {
      setIsRevokingAllOthers(true);
      const res = await clientRevokeAllOtherSessionsAction();
      if (res.success) {
        toast.success(res.message || "All other sessions revoked successfully");
        router.refresh();
      } else {
        toast.error(res.message || "Failed to revoke all other sessions");
      }
    } catch (error) {
      console.error("Error revoking all other sessions:", error);
      toast.error("Internal server error while revoking sessions");
    } finally {
      setIsRevokingAllOthers(false);
      setShowRevokeAllDialog(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5 text-primary" />;
      case "tablet":
        return <Tablet className="h-5 w-5 text-primary" />;
      case "desktop":
        return <Laptop className="h-5 w-5 text-primary" />;
      default:
        return <Globe className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search Header */}
      <Card className="shadow-sm border-border/60">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP, Browser, OS, or User Agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Actions: Refresh & Revoke All */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 cursor-pointer gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              <Button
                variant="destructive"
                size="default"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={counts.active <= 1}
                className="h-10 cursor-pointer gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                <span>Revoke All Others</span>
              </Button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              All
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {counts.all}
              </Badge>
            </Button>

            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              Active
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              >
                {counts.active}
              </Badge>
            </Button>

            <Button
              variant={statusFilter === "revoked" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("revoked")}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              Revoked
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300"
              >
                {counts.revoked}
              </Badge>
            </Button>

            <Button
              variant={statusFilter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("expired")}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              Expired
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300"
              >
                {counts.expired}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Cards List */}
      {filteredSessions.length === 0 ? (
        <Card className="shadow-sm border-border/60 p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">No sessions found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              No active or historical sessions match your current filter and
              search query.
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-2 text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map((session) => {
            const ua = parseUserAgent(session.userAgent);
            const status = getSessionStatus(session);
            const isSelectedRevoking = revokingSessionId === session.id;
            const isCurrentSession = Boolean(
              currentSessionId && session.id === currentSessionId,
            );

            return (
              <Card
                key={session.id}
                className={`shadow-sm border-border/60 transition-all hover:border-border/90 ${
                  isCurrentSession
                    ? "ring-2 ring-primary/40 border-primary/50 bg-primary/[0.02]"
                    : ""
                }`}
              >
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Device & Browser Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        {getDeviceIcon(ua.deviceType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base font-bold tracking-tight">
                            {ua.browser}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground">
                            on
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs font-semibold px-2 py-0.5 bg-muted/50"
                          >
                            {ua.os}
                          </Badge>
                          {isCurrentSession && (
                            <Badge
                              variant="default"
                              className="text-[10px] uppercase font-bold px-2 py-0.5 bg-primary text-primary-foreground"
                            >
                              Current Session
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="flex items-center gap-2 text-xs font-mono">
                          <span>IP: {session.ipAddress || "Unknown IP"}</span>
                          {session.ipAddress && (
                            <button
                              type="button"
                              onClick={() => handleCopyIp(session.ipAddress!)}
                              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Copy IP Address"
                            >
                              {copiedIp === session.ipAddress ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      {isCurrentSession ? (
                        <Badge
                          variant="default"
                          className="px-3 py-1 text-xs font-semibold gap-1.5 bg-primary/15 text-primary border border-primary/30"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Current Session
                        </Badge>
                      ) : status === "active" ? (
                        <Badge
                          variant="default"
                          className="px-3 py-1 text-xs font-semibold gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Active Session
                        </Badge>
                      ) : status === "revoked" ? (
                        <Badge
                          variant="destructive"
                          className="px-3 py-1 text-xs font-semibold gap-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Revoked
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="px-3 py-1 text-xs font-semibold gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Expired
                        </Badge>
                      )}

                      {status === "active" && !isCurrentSession && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRevokingSessionId(session.id)}
                          disabled={isRevokingSingle && isSelectedRevoking}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border-rose-200 dark:border-rose-900 cursor-pointer h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 pb-4 pt-0 space-y-4">
                  {/* Detailed Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3 border-t border-border/40">
                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary/70" />
                        Created At
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        Last Accessed
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatDate(session.accessedAt)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        Expires At
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatDate(session.expiresAt)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5 text-primary/70" />
                        Session ID
                      </span>
                      <code className="font-mono text-[11px] font-semibold truncate text-foreground">
                        {session.id}
                      </code>
                    </div>

                    {session.revokedAt && (
                      <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-rose-500/5 border border-rose-500/20 sm:col-span-2">
                        <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <ShieldOff className="h-3.5 w-3.5" />
                          Revoked Date & Reason
                        </span>
                        <span className="font-semibold text-foreground">
                          {formatDate(session.revokedAt)}
                          {session.revokeReason
                            ? ` (${session.revokeReason})`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Raw User Agent display */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                      <Terminal className="h-3 w-3" />
                      User Agent
                    </span>
                    <p className="text-[11px] font-mono text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/40 break-all select-all">
                      {ua.raw}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revoke Single Session Confirmation Dialog */}
      <AlertDialog
        open={Boolean(revokingSessionId)}
        onOpenChange={(open) => {
          if (!open) setRevokingSessionId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The device will be
              logged out immediately and will require signing in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingSingle}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSingle}
              disabled={isRevokingSingle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevokingSingle ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Other Sessions Confirmation Dialog */}
      <AlertDialog
        open={showRevokeAllDialog}
        onOpenChange={setShowRevokeAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will terminate and log out all other active sessions
              across all devices, keeping only your current session active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingAllOthers}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllOthers}
              disabled={isRevokingAllOthers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevokingAllOthers ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Revoking All...
                </>
              ) : (
                "Revoke All Other Sessions"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
