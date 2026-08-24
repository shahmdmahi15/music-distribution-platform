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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  LayoutGrid,
  List,
  Download,
  FileSpreadsheet,
  FileCode,
  ArrowUpDown,
  Monitor,
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

  try {
    const parser = new UAParser(uaString);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    const browserName = browser.name
      ? `${browser.name}${browser.version ? ` ${browser.version}` : ""}`
      : "Standard Browser";

    const osName = os.name
      ? `${os.name}${os.version ? ` ${os.version}` : ""}`
      : "Standard OS";

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
  } catch {
    return {
      browser: "Standard Browser",
      os: "Standard OS",
      deviceType: "desktop",
      raw: uaString || "Unknown",
    };
  }
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

const sortLabels: Record<string, string> = {
  "accessedAt:desc": "Recently Active",
  "createdAt:desc": "Newest First",
  "createdAt:asc": "Oldest First",
  "expiresAt:asc": "Expiring Soon",
};

export function ClientSessionList({
  sessions,
  currentSessionId,
}: ClientSessionListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "revoked" | "expired"
  >("all");
  const [sortBy, setSortBy] = useState("accessedAt:desc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Inspector modal state
  const [inspectSession, setInspectSession] = useState<Session | null>(null);

  // Revoke state
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingSingle, setIsRevokingSingle] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const [isRevokingAllOthers, setIsRevokingAllOthers] = useState(false);

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
        session.id.toLowerCase().includes(query) ||
        (session.code && session.code.toLowerCase().includes(query))
      );
    });

    const [field, order] = sortBy.split(":");
    return [...filtered].sort((a, b) => {
      // Current session always pinned to top
      if (currentSessionId) {
        if (a.id === currentSessionId) return -1;
        if (b.id === currentSessionId) return 1;
      }

      const dateA = new Date((a as any)[field] || 0).getTime();
      const dateB = new Date((b as any)[field] || 0).getTime();
      return order === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [sessions, statusFilter, searchQuery, sortBy, currentSessionId]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    toast.success("IP address copied to clipboard");
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Sessions updated.");
    }, 600);
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

  // Export handlers
  const handleExportCSV = () => {
    if (sessions.length === 0) {
      toast.error("No sessions available to export.");
      return;
    }

    const headers = [
      "Session ID",
      "IP Address",
      "Status",
      "Browser",
      "OS",
      "Accessed At",
      "Created At",
      "Expires At",
      "Revoked At",
      "Revoke Reason",
    ];

    const rows = [
      headers.join(","),
      ...sessions.map((s) => {
        const ua = parseUserAgent(s.userAgent);
        return [
          `"${s.id}"`,
          `"${s.ipAddress || ""}"`,
          `"${getSessionStatus(s)}"`,
          `"${ua.browser}"`,
          `"${ua.os}"`,
          `"${new Date(s.accessedAt).toISOString()}"`,
          `"${new Date(s.createdAt).toISOString()}"`,
          `"${new Date(s.expiresAt).toISOString()}"`,
          `"${s.revokedAt ? new Date(s.revokedAt).toISOString() : ""}"`,
          `"${(s.revokeReason || "").replace(/"/g, '""')}"`,
        ].join(",");
      }),
    ];

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `client_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sessions.length} sessions to CSV.`);
  };

  const handleExportJSON = () => {
    if (sessions.length === 0) {
      toast.error("No sessions available to export.");
      return;
    }

    const blob = new Blob([JSON.stringify(sessions, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `client_sessions_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sessions.length} sessions to JSON.`);
  };

  const otherActiveSessionsCount = sessions.filter(
    (s) => getSessionStatus(s) === "active" && s.id !== currentSessionId,
  ).length;

  return (
    <div className="w-full space-y-5">
      {/* Controls Strip: Search, Filter Tabs, Sort, and Actions */}
      <div className="space-y-3">
        {/* Row 1: Search Form + Global Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sessions by browser, OS, or IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 bg-background/80 w-full"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/40">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-7 px-2.5 text-xs rounded-md"
                title="Grid Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-7 px-2.5 text-xs rounded-md"
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Download className="h-3.5 w-3.5" />
                    <span>Export</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs font-semibold">
                    Export Session Log
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={handleExportCSV}
                    className="text-xs cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-2 text-emerald-600 dark:text-emerald-400" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportJSON}
                    className="text-xs cursor-pointer"
                  >
                    <FileCode className="h-3.5 w-3.5 mr-2 text-blue-600 dark:text-blue-400" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            {/* Revoke All Others */}
            {otherActiveSessionsCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowRevokeAllDialog(true)}
                disabled={isRevokingAllOthers}
                className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoke All Others ({otherActiveSessionsCount})
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Status Pills + Sort Select */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-0.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="h-7 text-xs rounded-full px-3"
            >
              All ({counts.all})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className={`h-7 text-xs rounded-full px-3 ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              }`}
            >
              Active ({counts.active})
            </Button>
            <Button
              variant={statusFilter === "revoked" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("revoked")}
              className={`h-7 text-xs rounded-full px-3 ${
                statusFilter === "revoked"
                  ? "bg-rose-600 text-white"
                  : "text-rose-600 dark:text-rose-400 border-rose-500/30"
              }`}
            >
              Revoked ({counts.revoked})
            </Button>
            <Button
              variant={statusFilter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("expired")}
              className={`h-7 text-xs rounded-full px-3 ${
                statusFilter === "expired"
                  ? "bg-amber-600 text-white"
                  : "text-amber-600 dark:text-amber-400 border-amber-500/30"
              }`}
            >
              Expired ({counts.expired})
            </Button>
          </div>

          {/* Sort Selector */}
          <div className="w-[170px] shrink-0">
            <Select value={sortBy} onValueChange={(val) => setSortBy(val || "accessedAt:desc")}>
              <SelectTrigger className="w-full h-8 text-xs bg-background/80">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Sort by">
                    {(val) => sortLabels[val as string] || val || "Sort by"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accessedAt:desc">Recently Active</SelectItem>
                <SelectItem value="createdAt:desc">Newest First</SelectItem>
                <SelectItem value="createdAt:asc">Oldest First</SelectItem>
                <SelectItem value="expiresAt:asc">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Sessions Display */}
      {filteredSessions.length === 0 ? (
        <Card className="shadow-sm border-dashed border-border/60">
          <CardContent className="p-12 text-center space-y-3">
            <div className="p-3.5 rounded-full bg-muted/60 text-muted-foreground mx-auto w-fit">
              <Monitor className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No sessions found
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No recorded sessions matched your active status filter or search criteria.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            const status = getSessionStatus(session);
            const ua = parseUserAgent(session.userAgent);

            let DeviceIcon = Laptop;
            if (ua.deviceType === "mobile") DeviceIcon = Smartphone;
            else if (ua.deviceType === "tablet") DeviceIcon = Tablet;

            return (
              <Card
                key={session.id}
                className={`overflow-hidden shadow-sm border transition-all ${
                  isCurrent
                    ? "border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20"
                    : "border-border/60 bg-card hover:border-border"
                }`}
              >
                <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isCurrent
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <DeviceIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-sm font-bold truncate">
                          {ua.browser}
                        </CardTitle>
                        {session.code && (
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] px-1.5 py-0 font-semibold border-border/80 bg-muted/40 text-foreground"
                          >
                            {session.code}
                          </Badge>
                        )}
                        {isCurrent && (
                          <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 font-semibold gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            This Device
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs truncate">
                        {ua.os}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {status === "active" ? (
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                      >
                        Active
                      </Badge>
                    ) : status === "revoked" ? (
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium"
                      >
                        Revoked
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[11px] px-2 py-0.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium"
                      >
                        Expired
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3 text-xs">
                  <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        IP Address
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
                        <span>{session.ipAddress || "127.0.0.1"}</span>
                        <button
                          onClick={() => handleCopyIp(session.ipAddress || "127.0.0.1")}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy IP"
                        >
                          {copiedIp === (session.ipAddress || "127.0.0.1") ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Last Accessed
                      </span>
                      <span className="text-foreground font-medium">
                        {formatDate(session.accessedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Created
                      </span>
                      <span className="text-foreground font-medium">
                        {formatDate(session.createdAt)}
                      </span>
                    </div>

                    {session.revokeReason && (
                      <div className="pt-1 border-t border-border/40 text-[11px] text-rose-600 dark:text-rose-400">
                        <span className="font-semibold">Reason: </span>
                        <span>{session.revokeReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectSession(session)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      <Info className="h-3.5 w-3.5 mr-1" />
                      Inspector
                    </Button>

                    {!isCurrent && status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRevokingSessionId(session.id)}
                        disabled={isRevokingSingle}
                        className="h-7 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/60">
                <TableRow>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Device & Browser
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    IP Address
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Last Active
                  </TableHead>
                  <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Created
                  </TableHead>
                  <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  const status = getSessionStatus(session);
                  const ua = parseUserAgent(session.userAgent);

                  let DeviceIcon = Laptop;
                  if (ua.deviceType === "mobile") DeviceIcon = Smartphone;
                  else if (ua.deviceType === "tablet") DeviceIcon = Tablet;

                  return (
                    <TableRow
                      key={session.id}
                      className={isCurrent ? "bg-emerald-500/5 font-medium" : ""}
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5">
                          <DeviceIcon className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-foreground truncate">
                                {ua.browser}
                              </span>
                              {session.code && (
                                <Badge
                                  variant="outline"
                                  className="font-mono text-[9px] px-1 py-0 font-medium"
                                >
                                  {session.code}
                                </Badge>
                              )}
                              {isCurrent && (
                                <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0 font-semibold">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block truncate">
                              {ua.os}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {status === "active" ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          >
                            Active
                          </Badge>
                        ) : status === "revoked" ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          >
                            Revoked
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          >
                            Expired
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-foreground">
                        {session.ipAddress || "127.0.0.1"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(session.accessedAt)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(session.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setInspectSession(session)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Inspect details"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </Button>

                          {!isCurrent && status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRevokingSessionId(session.id)}
                              className="h-7 text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/30"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Inspector Details Dialog */}
      {inspectSession && (
        <Dialog open={Boolean(inspectSession)} onOpenChange={() => setInspectSession(null)}>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary mb-1">
                <Terminal className="h-5 w-5" />
                <DialogTitle className="text-lg font-bold">
                  Session Diagnostics & Inspector
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Detailed technical telemetry recorded for this authenticated session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                {inspectSession.code && (
                  <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5">
                    <span className="text-muted-foreground block text-[11px]">Session Code</span>
                    <code className="font-mono font-bold text-primary truncate block">
                      {inspectSession.code}
                    </code>
                  </div>
                )}
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Session ID</span>
                  <code className="font-mono font-bold text-foreground truncate block">
                    {inspectSession.id}
                  </code>
                </div>
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">IP Address</span>
                  <span className="font-mono font-bold text-foreground block">
                    {inspectSession.ipAddress || "127.0.0.1"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Created</span>
                  <span className="font-semibold text-foreground block">
                    {formatDate(inspectSession.createdAt)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl border border-border/60 bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Expires</span>
                  <span className="font-semibold text-foreground block">
                    {formatDate(inspectSession.expiresAt)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-foreground text-xs">Raw User-Agent Header</span>
                <pre className="p-3 rounded-xl border border-border/60 bg-muted/50 text-[11px] font-mono whitespace-pre-wrap wrap-break-words text-foreground/90 max-h-36 overflow-y-auto">
                  {inspectSession.userAgent || "No user agent provided"}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Revoke Single Session Confirmation Dialog */}
      <AlertDialog
        open={Boolean(revokingSessionId)}
        onOpenChange={(open) => !open && setRevokingSessionId(null)}
      >
        <AlertDialogContent className="sm:max-w-[440px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <ShieldOff className="h-5 w-5" />
              <AlertDialogTitle className="text-lg font-bold">
                Revoke Session?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs">
              This will immediately terminate the selected session and require the user on that device to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isRevokingSingle} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSingle}
              disabled={isRevokingSingle}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isRevokingSingle ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
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
        <AlertDialogContent className="sm:max-w-[460px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <ShieldAlert className="h-5 w-5" />
              <AlertDialogTitle className="text-lg font-bold">
                Revoke All Other Sessions?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs">
              You are about to terminate all {otherActiveSessionsCount} other active sessions. You will remain logged in on this current browser device only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isRevokingAllOthers} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllOthers}
              disabled={isRevokingAllOthers}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              {isRevokingAllOthers ? (
                <>
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                  Terminating...
                </>
              ) : (
                `Revoke All (${otherActiveSessionsCount})`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
