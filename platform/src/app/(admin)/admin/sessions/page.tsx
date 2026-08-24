import { adminGetAllSessionsAction } from "@/actions/admin/session/admin-get-all-sessions.action";
import { meAction } from "@/actions/auth/me.action";
import { AdminSessionList } from "@/components/admin/session/admin-session-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Laptop,
  Clock,
  ShieldOff,
} from "lucide-react";
import { Session } from "@/types/session";

function getSessionStats(sessions: Session[]) {
  let active = 0;
  let revoked = 0;
  let expired = 0;

  const now = new Date();

  sessions.forEach((session) => {
    if (session.revokedAt) {
      revoked++;
    } else {
      const expiresAt = new Date(session.expiresAt);
      if (!isNaN(expiresAt.getTime()) && expiresAt < now) {
        expired++;
      } else {
        active++;
      }
    }
  });

  return {
    total: sessions.length,
    active,
    revoked,
    expired,
    activePercent:
      sessions.length > 0 ? Math.round((active / sessions.length) * 100) : 0,
  };
}

export default async function AdminSessionsPage() {
  const [sessionsRes, meRes] = await Promise.all([
    adminGetAllSessionsAction(),
    meAction(),
  ]);

  if (!sessionsRes.success) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Sessions</AlertTitle>
          <AlertDescription>
            {sessionsRes.message ||
              "Failed to load sessions. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const sessions = sessionsRes.sessions || [];
  const currentSessionId = meRes.user?.sessionId;
  const stats = getSessionStats(sessions);

  return (
    <div className="w-full min-w-0 p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <Laptop className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Admin Session Management
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          View, monitor, and manage all active and historical sessions for your administrator account.
        </p>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions Card */}
        <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Sessions
              </span>
              <div className="text-2xl font-bold tracking-tight text-foreground">
                {stats.total}
              </div>
              <span className="text-xs text-muted-foreground">All recorded devices</span>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <KeyRound className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions Card */}
        <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Active Sessions
              </span>
              <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {stats.active}
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.activePercent}% active rate
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Revoked Sessions Card */}
        <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Revoked Sessions
              </span>
              <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {stats.revoked}
              </div>
              <span className="text-xs text-rose-600 dark:text-rose-400">
                Terminated by user/system
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <ShieldOff className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Expired Sessions Card */}
        <Card className="shadow-sm border-border/60 bg-card hover:border-border transition-colors">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Expired Sessions
              </span>
              <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                {stats.expired}
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Natural TTL expiry
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sessions List Component */}
      <AdminSessionList
        sessions={sessions}
        currentSessionId={currentSessionId}
      />
    </div>
  );
}
