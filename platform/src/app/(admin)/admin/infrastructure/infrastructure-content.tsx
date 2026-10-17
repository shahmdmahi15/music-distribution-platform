"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Mail,
  Globe,
  RefreshCw,
  Power,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Send,
  ShieldCheck,
  Layers,
  Radio,
  Zap,
  Clock,
  ArrowUpRight,
  Sliders,
  ExternalLink,
  Lock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  InfrastructureOverviewData,
  adminGetInfrastructureOverviewAction,
} from "@/actions/admin/infrastructure/admin-get-infrastructure-overview.action";
import {
  adminExecuteInfrastructureAction,
  InfrastructureActionParams,
} from "@/actions/admin/infrastructure/admin-execute-infrastructure-action.action";
import Link from "next/link";

interface InfrastructureContentProps {
  initialData?: InfrastructureOverviewData;
}

export function InfrastructureContent({ initialData }: InfrastructureContentProps) {
  const [data, setData] = useState<InfrastructureOverviewData | undefined>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [isPending, startTransition] = useTransition();

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [rebootDialogOpen, setRebootDialogOpen] = useState(false);
  const [rebootConfirmInput, setRebootConfirmInput] = useState("");
  const [cloudflarePurgeDialogOpen, setCloudflarePurgeDialogOpen] = useState(false);

  // Manual refresh handler
  const handleRefresh = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await adminGetInfrastructureOverviewAction();
      if (res.success && res.data) {
        setData(res.data);
        if (!silent) toast.success("Infrastructure metrics refreshed.");
      } else {
        if (!silent) toast.error(res.message || "Failed to fetch updated metrics.");
      }
    } catch (err: any) {
      if (!silent) toast.error("Error refreshing infrastructure telemetry.");
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Auto-refresh interval effect
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      handleRefresh(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Execute general infrastructure action
  const runAction = async (
    params: InfrastructureActionParams,
    successMessage?: string,
  ) => {
    const actionKey = `${params.action}_${params.target || "default"}`;
    setActionLoading(actionKey);

    startTransition(async () => {
      try {
        const res = await adminExecuteInfrastructureAction(params);
        if (res.success) {
          toast.success(successMessage || res.message || "Operation succeeded!");
          // Re-fetch overview to reflect new state
          await handleRefresh(true);
        } else {
          toast.error(res.message || "Operation failed.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Communication failure.");
      } finally {
        setActionLoading(null);
      }
    });
  };

  // Emergency reboot execution
  const handleExecuteReboot = async () => {
    if (rebootConfirmInput.trim() !== "CONFIRM_EMERGENCY_REBOOT") {
      toast.error('You must type "CONFIRM_EMERGENCY_REBOOT" exactly.');
      return;
    }

    setRebootDialogOpen(false);
    setRebootConfirmInput("");
    await runAction(
      {
        action: "REBOOT_SERVER",
        confirmationToken: "CONFIRM_EMERGENCY_REBOOT",
      },
      "Emergency reboot scheduled in 1 minute. Host is draining connections.",
    );
  };

  // Send diagnostic test email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    await runAction(
      {
        action: "SEND_TEST_EMAIL",
        payload: testEmailAddress.trim(),
      },
      `Diagnostic test email successfully sent to ${testEmailAddress}!`,
    );
  };

  // Helper formatting
  const getRamBarColor = (percent: number) => {
    if (percent < 70) return "bg-emerald-500";
    if (percent < 85) return "bg-amber-500";
    return "bg-rose-500";
  };

  const getSystemStatus = () => {
    if (!data) return { text: "Connecting...", color: "bg-muted text-muted-foreground" };
    if (
      data.database.status === "HEALTHY" &&
      data.services.nginx === "active" &&
      data.services.postgresql === "active"
    ) {
      return {
        text: "All Systems Operational",
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    return {
      text: "Attention / Degraded",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  };

  const systemStatus = getSystemStatus();

  return (
    <div className="space-y-6">
      {/* Header with Title, Live Status Badge, and Polling Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Infrastructure & Fleet
            </h1>
            <Badge
              variant="outline"
              className={`px-3 py-1 font-semibold flex items-center gap-1.5 ${systemStatus.color}`}
            >
              <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
              {systemStatus.text}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time Mother Company node compute, PM2 process supervisor, PostgreSQL 16 database, S3/R2 storage, and Cloudflare edge proxy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 p-1.5 rounded-lg border">
            <Clock className="h-3.5 w-3.5 ml-1" />
            <span>Poll:</span>
            <select
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={0}>Off</option>
              <option value={5}>Every 5s</option>
              <option value={10}>Every 10s</option>
              <option value={30}>Every 30s</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRefresh(false)}
            disabled={isRefreshing || isPending}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Telemetry KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Node & CPU */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Compute & CPU
            </CardTitle>
            <Cpu className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {data?.host.cpu.usagePercent ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {data?.host.cpu.cores} Cores • {data?.host.arch.toUpperCase()}
            </p>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Load: {data?.host.cpu.loadAvg1m.toFixed(2)} (1m) • {data?.host.cpu.loadAvg5m.toFixed(2)} (5m)
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Memory / RAM */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              RAM Memory
            </CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {data?.host.memory.usedPercent ?? 0}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className={`h-full ${getRamBarColor(data?.host.memory.usedPercent || 0)}`}
                style={{ width: `${Math.min(100, data?.host.memory.usedPercent || 0)}` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 truncate">
              {data?.host.memory.usedFormatted} / {data?.host.memory.totalFormatted}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Disk Partition */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Primary Disk
            </CardTitle>
            <HardDrive className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {data?.disks[0]?.usedPercent ?? 0}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${Math.min(100, data?.disks[0]?.usedPercent || 0)}` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 truncate">
              {data?.disks[0]?.usedFormatted} used of {data?.disks[0]?.sizeFormatted}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Database Health */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              PostgreSQL 16
            </CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {data?.database.latencyMs ?? 0} ms
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Size: {data?.database.sizeFormatted}
            </p>
            <div className="mt-2 text-[11px] text-muted-foreground truncate">
              Active: {data?.database.activeConnections} / {data?.database.maxConnections} Conns
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Edge & SSL */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Edge Security
            </CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center gap-1.5">
              <span>SSL Strict</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              IP: {data?.edge.elasticIp}
            </p>
            <div className="mt-2 text-[11px] text-muted-foreground truncate">
              Cloudflare TLS 1.3 • DDoS Active
            </div>
          </CardContent>
        </Card>

        {/* Card 6: SES Outbound Mail */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              AWS SES Mail
            </CardTitle>
            <Mail className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold flex items-center gap-1">
              <span>{data?.mailing.status}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {data?.mailing.region}
            </p>
            <div className="mt-2 text-[11px] text-muted-foreground truncate">
              Quota: {data?.mailing.dailyQuotaLimit.toLocaleString()} / 24h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="compute" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 min-w-[580px] h-auto p-1 bg-muted/60">
            <TabsTrigger value="compute" className="flex items-center gap-2 py-2">
              <Cpu className="h-4 w-4" />
              <span>Compute & PM2</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2 py-2">
              <Database className="h-4 w-4" />
              <span>Database & Storage</span>
            </TabsTrigger>
            <TabsTrigger value="mailing" className="flex items-center gap-2 py-2">
              <Mail className="h-4 w-4" />
              <span>Mailing & SES</span>
            </TabsTrigger>
            <TabsTrigger value="edge" className="flex items-center gap-2 py-2">
              <Globe className="h-4 w-4" />
              <span>Cloudflare & CDN</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2 py-2">
              <Sliders className="h-4 w-4" />
              <span>Fleet & Maintenance</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: COMPUTE & PM2 PROCESSES */}
        {/* =================================================================== */}
        <TabsContent value="compute" className="space-y-6">
          {/* Host Specifications Card */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    Mother Company Host Node Specifications
                  </CardTitle>
                  <CardDescription>
                    Operating system details, kernel release, uptime, and Node.js execution runtime.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="w-fit font-mono text-xs">
                  Uptime: {data?.host.uptimeFormatted}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground block">Hostname</span>
                  <span className="font-medium font-mono truncate block mt-0.5">
                    {data?.host.hostname}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground block">OS Platform & Architecture</span>
                  <span className="font-medium truncate block mt-0.5">
                    {data?.host.osType} ({data?.host.arch})
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground block">Kernel Version</span>
                  <span className="font-medium font-mono text-xs truncate block mt-0.5">
                    {data?.host.release}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border">
                  <span className="text-xs text-muted-foreground block">Node.js Runtime</span>
                  <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    {data?.host.nodeVersion}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PM2 Process Supervisor Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    PM2 Application Cluster Processes
                  </CardTitle>
                  <CardDescription>
                    Zero-downtime cluster instances running API endpoints and Platform SSR portal.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction({ action: "RELOAD_PM2" }, "All PM2 processes reloaded with zero downtime.")}
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reload All (Zero-Downtime)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction({ action: "RESTART_PM2" }, "All PM2 processes restarted.")}
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Restart All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction({ action: "FLUSH_PM2_LOGS" }, "All application logs cleared.")}
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Flush Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction({ action: "RELOAD_NGINX" }, "Nginx reverse proxy reloaded successfully.")}
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Reload Nginx
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">App ID</TableHead>
                      <TableHead>Process Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Memory (RSS)</TableHead>
                      <TableHead>CPU %</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Restarts</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.pm2.processes.map((proc) => {
                      const isProcLoading =
                        actionLoading === `RELOAD_PM2_${proc.id}` ||
                        actionLoading === `RESTART_PM2_${proc.id}`;
                      return (
                        <TableRow key={proc.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            #{proc.id}
                          </TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {proc.name}
                            {proc.version && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                v{proc.version}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                proc.status === "online"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              }
                            >
                              {proc.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {proc.memoryFormatted}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {proc.cpu.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {proc.mode}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {proc.restarts}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {Math.floor(proc.uptimeSeconds / 60)}m
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcLoading || isPending}
                                onClick={() =>
                                  runAction(
                                    { action: "RELOAD_PM2", target: String(proc.id) },
                                    `Process #${proc.id} (${proc.name}) reloaded.`,
                                  )
                                }
                                className="h-7 px-2 text-xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reload
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcLoading || isPending}
                                onClick={() =>
                                  runAction(
                                    { action: "RESTART_PM2", target: String(proc.id) },
                                    `Process #${proc.id} (${proc.name}) restarted.`,
                                  )
                                }
                                className="h-7 px-2 text-xs"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Restart
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 2: DATABASE & STORAGE */}
        {/* =================================================================== */}
        <TabsContent value="storage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PostgreSQL 16 Telemetry */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    PostgreSQL 16 Production Database
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runAction({ action: "TEST_DATABASE_CONNECTION" })}
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs"
                  >
                    <Activity className="h-3.5 w-3.5 text-purple-500" />
                    Ping Latency
                  </Button>
                </div>
                <CardDescription>
                  Normalized relational database with connection pooling and strict cascade constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs text-muted-foreground block">Active Connections</span>
                    <span className="text-lg font-bold font-mono">
                      {data?.database.activeConnections} / {data?.database.maxConnections}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <span className="text-xs text-muted-foreground block">Database Size</span>
                    <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                      {data?.database.sizeFormatted}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border col-span-2 sm:col-span-1">
                    <span className="text-xs text-muted-foreground block">Query Latency</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {data?.database.latencyMs} ms
                    </span>
                  </div>
                </div>

                {/* Database Table Counts Grid */}
                <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Core Records Inventory
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">WhiteLabels</span>
                      <span className="font-bold text-sm">{data?.database.tables.whiteLabels}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Releases</span>
                      <span className="font-bold text-sm">{data?.database.tables.releases}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Audio Tracks</span>
                      <span className="font-bold text-sm">{data?.database.tables.tracks}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Platform Users</span>
                      <span className="font-bold text-sm">{data?.database.tables.users}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Contracts</span>
                      <span className="font-bold text-sm">{data?.database.tables.contracts}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Payees</span>
                      <span className="font-bold text-sm">{data?.database.tables.payees}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">DSP Reports</span>
                      <span className="font-bold text-sm">{data?.database.tables.dspReports}</span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-muted-foreground block">Royalty Runs</span>
                      <span className="font-bold text-sm">{data?.database.tables.royaltyRuns}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automated Database Backups & DR */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-emerald-500" />
                    Automated Disaster Recovery & Backups
                  </CardTitle>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() =>
                      runAction(
                        { action: "TRIGGER_DATABASE_BACKUP" },
                        "Database dump executed and saved to /var/backups/postgres.",
                      )
                    }
                    disabled={actionLoading !== null || isPending}
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Database className="h-3.5 w-3.5" />
                    Backup Database Now
                  </Button>
                </div>
                <CardDescription>
                  Daily automated pg_dump cron with cryptographic SHA-256 integrity verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Latest Cryptographic Backup Dump
                    </span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-[11px]">
                      SHA-256 Verified
                    </Badge>
                  </div>
                  {data?.database.backup.latestBackup ? (
                    <div className="font-mono text-xs space-y-1">
                      <div className="font-bold text-foreground">
                        {data.database.backup.latestBackup.filename}
                      </div>
                      <div className="text-muted-foreground">
                        Size: {data.database.backup.latestBackup.sizeFormatted} • Created:{" "}
                        {new Date(data.database.backup.latestBackup.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No backups detected in /var/backups/postgres yet. Click "Backup Database Now" to trigger an initial dump.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-muted/40 rounded-lg border">
                    <span className="text-muted-foreground block">Cron Schedule</span>
                    <span className="font-semibold block mt-0.5">
                      {data?.database.backup.automatedDailyCron}
                    </span>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg border">
                    <span className="text-muted-foreground block">Retained Dumps</span>
                    <span className="font-semibold block mt-0.5">
                      {data?.database.backup.totalBackups} Archived Dumps
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Disk Partitions & Storage Vault */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Host Disk Partitions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Linux Filesystem Partitions (df)
                </CardTitle>
                <CardDescription>
                  Mounted volumes, available capacity, and usage thresholds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data?.disks.map((disk, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg border space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold">{disk.mountPoint} ({disk.filesystem})</span>
                        <span className="font-bold">{disk.usedPercent}% Used</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            disk.usedPercent > 80 ? "bg-rose-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(100, disk.usedPercent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>Used: {disk.usedFormatted}</span>
                        <span>Available: {disk.availableFormatted}</span>
                        <span>Total: {disk.sizeFormatted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audio Vault & Cloudflare R2 Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="h-4 w-4 text-cyan-500" />
                  Audio Vault & Object Storage
                </CardTitle>
                <CardDescription>
                  High-speed audio master streaming and lossless direct uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">S3 / R2 Bucket:</span>
                    <span className="font-semibold text-foreground">{data?.storage.bucketName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AWS Region:</span>
                    <span>{data?.storage.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Storage Tier:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      $0.00 Egress Architecture
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-muted/20 border rounded-lg">
                    <span className="text-2xl font-bold font-mono">
                      {data?.storage.totalAudioTracksStored}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Audio Masters Stored
                    </span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-lg">
                    <span className="text-2xl font-bold font-mono">
                      {data?.storage.totalCoverArtStored}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      3000px Cover Artworks
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 3: MAILING & SES DELIVERABILITY */}
        {/* =================================================================== */}
        <TabsContent value="mailing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AWS SES Identity & Quota */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-cyan-500" />
                  AWS Simple Email Service (SESv2) Pipeline
                </CardTitle>
                <CardDescription>
                  Cryptographically signed DKIM, SPF alignment, and custom MAIL FROM configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SES Mail Identity:</span>
                    <span className="font-semibold text-foreground">
                      {data?.mailing.identityDomain || "platform.royalmotionit.com"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Identity Sender:</span>
                    <span className="font-semibold">{data?.mailing.senderEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom MAIL FROM:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {data?.mailing.mailFromDomain}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SES AWS Region:</span>
                    <span>{data?.mailing.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Sending Rate:</span>
                    <span>{data?.mailing.maxSendRate} emails/sec</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">24-Hour Sending Quota:</span>
                    <span className="font-semibold font-mono">
                      {data?.mailing.dailyQuotaSent} / {data?.mailing.dailyQuotaLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500"
                      style={{
                        width: `${Math.max(
                          2,
                          Math.min(
                            100,
                            ((data?.mailing.dailyQuotaSent || 0) /
                              (data?.mailing.dailyQuotaLimit || 1)) *
                              100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Email Deliverability Test Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Live Deliverability & Inbox Placement Test
                </CardTitle>
                <CardDescription>
                  Send an authenticated diagnostic test message to verify SPF, DKIM, and DMARC alignment in seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendTestEmail} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="testEmailInput" className="text-xs">
                      Recipient Email Address
                    </Label>
                    <Input
                      id="testEmailInput"
                      type="email"
                      placeholder="e.g. your-email@company.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={actionLoading !== null || isPending}
                    className="w-full gap-2 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send Diagnostic Test Email
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 4: CLOUDFLARE & CDN */}
        {/* =================================================================== */}
        <TabsContent value="edge" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edge Security Specifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" />
                    Cloudflare Global Anycast Edge & WAF
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCloudflarePurgeDialogOpen(true)}
                    className="gap-1.5 text-xs text-orange-600 border-orange-500/30 hover:bg-orange-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Purge Edge Cache
                  </Button>
                </div>
                <CardDescription>
                  DDoS mitigation, TLS 1.3 termination, and zero-trust reverse proxying.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/40 border text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Zone Domain:</span>
                    <span className="font-semibold">{data?.edge.zoneDomain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origin Elastic IP:</span>
                    <span className="font-semibold text-foreground">{data?.edge.elasticIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SSL/TLS Encryption Mode:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Full (Strict) with Origin CA
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TLS Protocol:</span>
                    <span>{data?.edge.tlsVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DDoS Protection:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Always-On Automated Shield</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs space-y-1">
                  <span className="font-semibold text-orange-600 dark:text-orange-400 block">
                    Cloudflare Full (Strict) Ingress Rules
                  </span>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Traffic terminates at the closest Cloudflare Edge data center, is inspected for L7 DDoS attacks, and proxies over encrypted TLS to Nginx on Mother Company Origin <code>47.130.57.66</code>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DNS Interconnect Directory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  Primary DNS Ingress Endpoints
                </CardTitle>
                <CardDescription>
                  Real-time routing status for Mother Company core web portals, APIs, and mailing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                    <div>
                      <span className="font-semibold block font-mono">platform.royalmotionit.com</span>
                      <span className="text-[11px] text-muted-foreground">Central Platform Console</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Proxied (Edge SSL)
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                    <div>
                      <span className="font-semibold block font-mono">api.royalmotionit.com</span>
                      <span className="text-[11px] text-muted-foreground">Central NestJS API Services</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Proxied (Edge SSL)
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                    <div>
                      <span className="font-semibold block font-mono">mail.platform.royalmotionit.com</span>
                      <span className="text-[11px] text-muted-foreground">AWS SES Custom MAIL FROM & MX Routing</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      DNS Configured
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                    <div>
                      <span className="font-semibold block font-mono">royalmotionit.com</span>
                      <span className="text-[11px] text-muted-foreground">Apex Corporate Domain & Ingress</span>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Proxied (Edge SSL)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* =================================================================== */}
        {/* TAB 5: FLEET & MAINTENANCE */}
        {/* =================================================================== */}
        <TabsContent value="maintenance" className="space-y-6">
          {/* WhiteLabel Fleet Overview */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    WhiteLabel Customer Dedicated Fleets
                  </CardTitle>
                  <CardDescription>
                    Dedicated EC2 instances running isolated distribution bundles with autonomous self-updating.
                  </CardDescription>
                </div>
                <Link href="/admin/whitelabels">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    View All Tenants
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-muted/30 border rounded-lg">
                  <span className="text-2xl font-bold font-mono">
                    {data?.whitelabelFleet.totalTenants}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">Total WhiteLabels</span>
                </div>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {data?.whitelabelFleet.activeTenants}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">Active & Deployed</span>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    v{data?.whitelabelFleet.latestReleaseVersion}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Release ({data?.whitelabelFleet.latestReleaseCommit.slice(0, 7)})
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border rounded-lg">
                  <span className="text-2xl font-bold font-mono">
                    {data?.whitelabelFleet.bundleSizeFormatted}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">Bundle Archive Size</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Server Controls */}
          <Card className="border-rose-500/30">
            <CardHeader className="bg-rose-500/5">
              <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Power className="h-4 w-4" />
                Emergency System Administration & Host Reboot
              </CardTitle>
              <CardDescription>
                High-privilege maintenance actions. Rebooting the server will briefly interrupt API traffic while the instance cycles.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Strict Safety Protocol</AlertTitle>
                <AlertDescription className="text-xs">
                  Rebooting schedules an orderly 60-second system restart so active DB transactions flush and connections terminate safely.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => runAction({ action: "RESTART_NGINX" }, "Nginx reverse proxy restarted.")}
                  disabled={actionLoading !== null || isPending}
                  className="text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Restart Nginx Service
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setRebootDialogOpen(true)}
                  disabled={actionLoading !== null || isPending}
                  className="text-xs gap-1.5 bg-rose-600 hover:bg-rose-700"
                >
                  <Power className="h-3.5 w-3.5" />
                  Emergency Host Reboot
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Emergency Reboot Confirmation Dialog */}
      <Dialog open={rebootDialogOpen} onOpenChange={setRebootDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Emergency Server Reboot
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action will issue a system reboot command to the primary AWS EC2 host (<code>47.130.57.66</code>).
              To confirm this action, please type <strong>CONFIRM_EMERGENCY_REBOOT</strong> below:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Input
              value={rebootConfirmInput}
              onChange={(e) => setRebootConfirmInput(e.target.value)}
              placeholder="CONFIRM_EMERGENCY_REBOOT"
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setRebootDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={rebootConfirmInput.trim() !== "CONFIRM_EMERGENCY_REBOOT"}
              onClick={handleExecuteReboot}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Confirm & Schedule Reboot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cloudflare Purge Cache Confirmation Dialog */}
      <Dialog open={cloudflarePurgeDialogOpen} onOpenChange={setCloudflarePurgeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Trash2 className="h-5 w-5" />
              Purge Cloudflare Global Edge Cache
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will purge all cached assets across all global Cloudflare Edge data centers. The next incoming requests will fetch fresh data directly from origin servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setCloudflarePurgeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                setCloudflarePurgeDialogOpen(false);
                await runAction(
                  { action: "PURGE_CLOUDFLARE_CACHE" },
                  "Cloudflare Edge cache successfully invalidated globally.",
                );
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Purge Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
