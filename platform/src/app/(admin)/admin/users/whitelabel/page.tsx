import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Building2,
  ShieldCheck,
  Disc3,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function AdminWhiteLabelUsersPage() {
  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Multi-Tenant Hierarchy
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            WhiteLabel Tenant Directory & Users
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Inspect, manage, and audit user populations partitioned across activated WhiteLabel partner distribution instances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/admin/whitelabels" />}
            size="sm"
            className="text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Disc3 className="h-3.5 w-3.5" />
            View Active Instances
          </Button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tenant Organizations
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                0
              </div>
              <span className="text-[11px] text-muted-foreground">Active isolated tenants</span>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tenant Administrators
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                0
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Delegated tenant managers
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Managed Artists
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                0
              </div>
              <span className="text-[11px] text-muted-foreground">WhiteLabel-bound creators</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tenant Security
              </span>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                100%
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Cryptographically isolated
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Tenant Security Architecture Notice */}
      <Card className="border-border/80 bg-muted/20">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Multi-Tenant Partitioning Active
              </h3>
              <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                WhiteLabel users are scoped strictly to their respective tenant domains via cryptographic sub-account partitioning. Platform administrators can inspect aggregate rosters once partner instances complete vetting and onboarding approval.
              </p>
            </div>
          </div>
          <Button
            render={<Link href="/admin/whitelabels" />}
            variant="outline"
            size="sm"
            className="text-xs shrink-0 gap-1.5"
          >
            Review Inbound Applications
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Empty State / Directory Container */}
      <Card className="glass-card shadow-sm border-dashed border-border/80">
        <CardContent className="p-12 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/5 text-primary mx-auto w-fit border border-primary/20">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-foreground">
              No WhiteLabel User Accounts Provisioned Yet
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When a WhiteLabel enterprise instance is approved and launched, its tenant administrators and enrolled artists will automatically appear here with telemetry and audit controls.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              render={<Link href="/admin/whitelabels" />}
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <Disc3 className="h-3.5 w-3.5" />
              Manage WhiteLabel Applications
            </Button>
            <Button
              render={<Link href="/admin/users/platform" />}
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              Platform Operators
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
