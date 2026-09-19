"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await getSessionsAction();
      if (res.success && res.sessions) {
        setSessions(res.sessions);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
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
    if (!ua) return <Monitor className="w-5 h-5" />;
    const lower = ua.toLowerCase();
    if (lower.includes("mobi") || lower.includes("android") || lower.includes("iphone")) {
      return <Smartphone className="w-5 h-5" />;
    }
    if (lower.includes("mac") || lower.includes("windows") || lower.includes("linux")) {
      return <Laptop className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Active Device Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your logged-in browsers and devices across the portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSessions}
            disabled={loading}
            className="p-2 rounded-xl border border-border/60 hover:bg-accent transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <button
              onClick={handleRevokeOthers}
              disabled={isPending}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out All Other Devices
            </button>
          )}
        </div>
      </div>

      {/* Security Tip Banner */}
      <div className="p-4 rounded-2xl bg-accent/40 border border-border/50 flex items-start gap-3.5 text-xs text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Sessions expire automatically after 7 days of inactivity. If you notice any suspicious device or IP address, click <strong>Revoke</strong> immediately to invalidate that token.
        </p>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground bg-card rounded-2xl border border-border/40">
            No active sessions found.
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                session.isCurrent
                  ? "bg-card border-primary/40 shadow-sm"
                  : "bg-card/60 border-border/60 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    session.isCurrent
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getDeviceIcon(session.userAgent)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">
                      {session.userAgent || "Unknown Device"}
                    </span>
                    {session.isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        This Device
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      IP: {session.ipAddress || "Private / Loopback"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Accessed: {new Date(session.accessedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  onClick={() => handleRevoke(session.code)}
                  disabled={isPending}
                  className="self-end sm:self-center px-3 py-1.5 rounded-lg text-xs font-medium border border-border/80 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
