import { adminGetWhiteLabelUsersAction } from "@/actions/admin/users/whitelabel/admin-get-whitelabel-users.action";
import { WhiteLabelUsersTable } from "@/components/admin/users/whitelabel/whitelabel-users-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  Building2,
  ShieldCheck,
  Disc3,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    page?: string;
  }>;
}

export default async function AdminWhiteLabelUsersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const data = await adminGetWhiteLabelUsersAction({
    search: params.search,
    role: params.role,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: 50,
  });

  const { stats, users, pagination } = data;

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 space-y-8">
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
            Inspect, manage, and audit user populations partitioned across
            activated WhiteLabel partner distribution instances.
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
                {stats.totalTenants}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Active isolated tenants
              </span>
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
                {stats.totalAdmins}
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
                Managed Artists / Creators
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.totalArtists}
              </div>
              <span className="text-[11px] text-muted-foreground">
                WhiteLabel-bound creators
              </span>
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
                2FA Adoption Rate
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.twoFactorRate}%
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Security compliance
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Users Data Table */}
      <WhiteLabelUsersTable
        initialUsers={users}
        total={pagination.total}
      />
    </div>
  );
}
