import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Crown,
  Shield,
  Briefcase,
  UserCheck2,
  User,
} from "lucide-react";
import { PlatformUsersStats as StatsType } from "@/types/platform-user";

interface PlatformUsersStatsProps {
  stats: StatsType;
}

export function PlatformUsersStats({ stats }: PlatformUsersStatsProps) {
  const total = stats.totalUsers || 0;
  const activePercent = total > 0 ? Math.round((stats.activeUsers / total) * 100) : 0;
  const twoFactorPercent = total > 0 ? Math.round((stats.twoFactorUsers / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Platform Users
            </span>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
              <span>{stats.verifiedUsers} email verified</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <Users className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Accounts
            </span>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.activeUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
              <UserCheck className="h-3.5 w-3.5" />
              <span>{activePercent}% active rate</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Locked / Suspended Users */}
      <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Locked Accounts
            </span>
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {stats.lockedUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 pt-1">
              <UserX className="h-3.5 w-3.5" />
              <span>
                {stats.lockedUsers === 0
                  ? "No locked accounts"
                  : `${stats.lockedUsers} require attention`}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <UserX className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2FA Adoption */}
      <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              2FA Security Adoption
            </span>
            <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {stats.twoFactorUsers.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 pt-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{twoFactorPercent}% accounts protected</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PlatformUsersRoleBadges({
  roleCounts,
}: {
  roleCounts: StatsType["roleCounts"];
}) {
  const roles = [
    {
      role: "OWNER",
      label: "Owners",
      count: roleCounts.OWNER,
      icon: Crown,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    {
      role: "ADMIN",
      label: "Admins",
      count: roleCounts.ADMIN,
      icon: Shield,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    {
      role: "MANAGER",
      label: "Managers",
      count: roleCounts.MANAGER,
      icon: Briefcase,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    {
      role: "STAFF",
      label: "Staff",
      count: roleCounts.STAFF,
      icon: UserCheck2,
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    },
    {
      role: "CLIENT",
      label: "Clients",
      count: roleCounts.CLIENT,
      icon: User,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-xs font-semibold text-muted-foreground mr-1">
        Roles Breakdown:
      </span>
      {roles.map((r) => {
        const Icon = r.icon;
        return (
          <Badge
            key={r.role}
            variant="outline"
            className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 ${r.color}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{r.label}:</span>
            <span className="font-bold">{r.count}</span>
          </Badge>
        );
      })}
    </div>
  );
}
