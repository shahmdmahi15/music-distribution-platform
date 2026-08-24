"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UAParser } from "ua-parser-js";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Mail,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Unlock,
  RotateCcw,
  LogOut,
  Trash2,
  UserPen,
  Laptop,
  Globe,
  Crown,
  Briefcase,
  UserCheck2,
  User,
  Copy,
  Check,
  Smartphone,
  CreditCard,
  Building2,
  AlertTriangle,
} from "lucide-react";
import { adminGetPlatformUserDetailsAction } from "@/actions/admin/users/platform/admin-get-platform-user-details.action";
import { adminResetAttemptsPlatformUserAction } from "@/actions/admin/users/platform/admin-reset-attempts-platform-user.action";
import { adminRevokeSessionsPlatformUserAction } from "@/actions/admin/users/platform/admin-revoke-sessions-platform-user.action";
import { adminUpdatePlatformUserAction } from "@/actions/admin/users/platform/admin-update-platform-user.action";
import { PlatformUserDetail, PlatformUserItem } from "@/types/platform-user";
import { Role } from "@/types/user";

interface PlatformUserDetailsSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEdit: (user: PlatformUserItem) => void;
  onOpenLock: (user: PlatformUserItem) => void;
  onOpenResetPassword: (user: PlatformUserItem) => void;
  onOpenDelete: (user: PlatformUserItem) => void;
  currentUserId?: string;
  currentUserRole?: Role;
}

function parseUserAgent(uaString: string | null) {
  if (!uaString) return { browser: "Unknown Browser", os: "Unknown OS" };
  try {
    const parser = new UAParser(uaString);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return {
      browser: browser.name
        ? `${browser.name} ${browser.major || ""}`.trim()
        : "Standard Browser",
      os: os.name ? `${os.name} ${os.version || ""}`.trim() : "Unknown OS",
    };
  } catch {
    return { browser: "Standard Browser", os: "Unknown OS" };
  }
}

export function PlatformUserDetailsSheet({
  userId,
  open,
  onOpenChange,
  onOpenEdit,
  onOpenLock,
  onOpenResetPassword,
  onOpenDelete,
  currentUserId,
  currentUserRole,
}: PlatformUserDetailsSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [userDetail, setUserDetail] = useState<PlatformUserDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "sessions">(
    "profile",
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      setActiveTab("profile");
      adminGetPlatformUserDetailsAction(userId)
        .then((res) => {
          if (res.success && res.user) {
            setUserDetail(res.user);
          } else {
            toast.error(res.message || "Failed to load user details.");
            onOpenChange(false);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setUserDetail(null);
    }
  }, [open, userId, onOpenChange]);

  if (!open) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleEmailVerified = async (newVal: boolean) => {
    if (!userDetail) return;
    setActionLoading(true);
    try {
      const res = await adminUpdatePlatformUserAction(userDetail.id, {
        emailVerified: newVal,
      });
      if (res.success) {
        toast.success(
          `Email verification status updated to ${newVal ? "Verified" : "Unverified"}.`,
        );
        setUserDetail((prev) => (prev ? { ...prev, emailVerified: newVal } : null));
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTwoFactor = async (newVal: boolean) => {
    if (!userDetail) return;
    setActionLoading(true);
    try {
      const res = await adminUpdatePlatformUserAction(userDetail.id, {
        twoFactorEnabled: newVal,
      });
      if (res.success) {
        toast.success(
          `Two-Factor authentication ${newVal ? "enabled" : "disabled"}.`,
        );
        setUserDetail((prev) =>
          prev ? { ...prev, twoFactorEnabled: newVal } : null,
        );
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAttempts = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const res = await adminResetAttemptsPlatformUserAction(userId);
      if (res.success) {
        toast.success(res.message);
        const updated = await adminGetPlatformUserDetailsAction(userId);
        if (updated.success && updated.user) {
          setUserDetail(updated.user);
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const res = await adminRevokeSessionsPlatformUserAction(userId);
      if (res.success) {
        toast.success(res.message);
        const updated = await adminGetPlatformUserDetailsAction(userId);
        if (updated.success && updated.user) {
          setUserDetail(updated.user);
        }
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const roleConfig = {
    OWNER: {
      label: "Platform Owner",
      icon: Crown,
      badgeColor:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    ADMIN: {
      label: "Administrator",
      icon: Shield,
      badgeColor:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    MANAGER: {
      label: "Manager",
      icon: Briefcase,
      badgeColor:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    STAFF: {
      label: "Staff Member",
      icon: UserCheck2,
      badgeColor:
        "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    },
    CLIENT: {
      label: "Client",
      icon: User,
      badgeColor:
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
    },
  }[userDetail?.role || "CLIENT"];

  const RoleIcon = roleConfig.icon;
  const fullName = userDetail
    ? `${userDetail.firstName} ${userDetail.lastName}`
    : "";
  const avatarFallback = userDetail
    ? `${userDetail.firstName?.charAt(0) || ""}${userDetail.lastName?.charAt(0) || ""}`.toUpperCase()
    : "";

  const totalSecurityFailures = userDetail
    ? userDetail.failedLoginAttempts +
      userDetail.failedVerificationAttempts +
      userDetail.failedPasswordResetAttempts +
      userDetail.failedTwoFactorAttempts
    : 0;

  const securityRiskLevel =
    totalSecurityFailures >= 5 || userDetail?.isLocked
      ? { label: "High Risk", color: "text-rose-600 bg-rose-500/10 border-rose-500/30" }
      : totalSecurityFailures > 0
        ? { label: "Moderate Risk", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" }
        : { label: "Secure", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6 space-y-5">
        {loading || !userDetail ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
            <Spinner className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Loading platform user details...
            </p>
          </div>
        ) : (
          <>
            {/* Header / User Card */}
            <SheetHeader className="text-left space-y-3 pb-2 border-b border-border/40">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 rounded-2xl border-2 border-border shadow-sm">
                    <AvatarImage
                      src={userDetail.image || undefined}
                      alt={fullName}
                    />
                    <AvatarFallback className="rounded-2xl text-lg font-bold bg-primary/10 text-primary">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
                      <span>{fullName}</span>
                      {userDetail.code && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                          >
                            {userDetail.code}
                          </Badge>
                          <button
                            onClick={() => copyToClipboard(userDetail.code!, "User Code")}
                            className="text-muted-foreground hover:text-foreground"
                            title="Copy User Code"
                          >
                            {copiedField === "User Code" ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{userDetail.email}</span>
                      <button
                        onClick={() => copyToClipboard(userDetail.email, "Email")}
                        className="text-muted-foreground hover:text-foreground"
                        title="Copy Email"
                      >
                        {copiedField === "Email" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </SheetDescription>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium flex items-center gap-1 ${roleConfig.badgeColor}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {roleConfig.label}
                      </Badge>

                      {userDetail.isLocked ? (
                        <Badge
                          variant="destructive"
                          className="text-xs px-2 py-0.5 flex items-center gap-1 font-medium"
                        >
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </Badge>
                      )}

                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 font-medium ${securityRiskLevel.color}`}
                      >
                        {securityRiskLevel.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Quick Actions Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  onOpenChange(false);
                  onOpenEdit(userDetail);
                }}
              >
                <UserPen className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-amber-600 dark:text-amber-400 border-amber-500/30"
                onClick={() => {
                  onOpenChange(false);
                  onOpenResetPassword(userDetail);
                }}
              >
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs h-8 ${
                  userDetail.isLocked
                    ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "text-rose-600 dark:text-rose-400 border-rose-500/30"
                }`}
                onClick={() => {
                  onOpenChange(false);
                  onOpenLock(userDetail);
                }}
              >
                {userDetail.isLocked ? (
                  <>
                    <Unlock className="h-3.5 w-3.5 mr-1.5" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Lock Account
                  </>
                )}
              </Button>

              {userDetail.id !== currentUserId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenDelete(userDetail);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/40 text-xs">
              <button
                onClick={() => setActiveTab("profile")}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                  activeTab === "profile"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Profile & Details
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                  activeTab === "security"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Security & Access
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`pb-2.5 px-3 font-semibold transition-colors border-b-2 ${
                  activeTab === "sessions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Active Sessions ({userDetail.sessions?.length || 0})
              </button>
            </div>

            {/* Tab 1: Profile & Details */}
            {activeTab === "profile" && (
              <div className="space-y-4 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Account Created
                    </span>
                    <p className="font-semibold text-foreground">
                      {new Date(userDetail.createdAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-card space-y-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Last Active
                    </span>
                    <p className="font-semibold text-foreground">
                      {userDetail.lastLoginAt
                        ? new Date(userDetail.lastLoginAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Never logged in"}
                    </p>
                  </div>
                </div>

                {/* Linked OAuth Accounts */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Linked OAuth Providers
                  </span>
                  {userDetail.oAuthAccounts &&
                  userDetail.oAuthAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {userDetail.oAuthAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <Globe className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground uppercase">
                              {acc.provider}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              (ID: {acc.providerId.slice(0, 8)}...)
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            Connected{" "}
                            {new Date(acc.createdAt).toLocaleDateString("en-US", {
                              dateStyle: "short",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic p-3 rounded-xl border border-dashed border-border/60 text-center">
                      No external OAuth accounts linked.
                    </p>
                  )}
                </div>

                {/* WhiteLabel / Subscription (if client) */}
                {userDetail.subscription && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                      WhiteLabel & Subscription
                    </span>
                    <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-3 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span>
                            {userDetail.subscription.whiteLabel?.name ||
                              "WhiteLabel Instance"}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary"
                        >
                          Subscriber
                        </Badge>
                      </div>

                      {userDetail.subscription.suspendedAt && (
                        <p className="text-rose-600 dark:text-rose-400 font-medium">
                          Suspended on{" "}
                          {new Date(
                            userDetail.subscription.suspendedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {userDetail.subscription.payments &&
                        userDetail.subscription.payments.length > 0 && (
                          <div className="border-t border-border/40 pt-2 space-y-1.5">
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              Recent Subscription Payments:
                            </span>
                            {userDetail.subscription.payments.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between text-[11px] text-muted-foreground"
                              >
                                <span>
                                  ${(p.amount / 100).toFixed(2)} - Status:{" "}
                                  <span className="font-semibold text-foreground">
                                    {p.status}
                                  </span>
                                </span>
                                <span>
                                  {new Date(p.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Security & Access */}
            {activeTab === "security" && (
              <div className="space-y-4 pt-1 text-xs">
                {/* Security Failure Meters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Failed Security Counters
                    </span>
                    {totalSecurityFailures > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetAttempts}
                        disabled={actionLoading}
                        className="h-6 text-xs text-primary hover:text-primary px-2"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset All Failures
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl border border-border/60 bg-card">
                      <div className="font-bold text-base text-foreground">
                        {userDetail.failedLoginAttempts}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Login Fails
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/60 bg-card">
                      <div className="font-bold text-base text-foreground">
                        {userDetail.failedVerificationAttempts}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Verify Fails
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/60 bg-card">
                      <div className="font-bold text-base text-foreground">
                        {userDetail.failedTwoFactorAttempts}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        2FA Fails
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-border/60 bg-card">
                      <div className="font-bold text-base text-foreground">
                        {userDetail.failedPasswordResetAttempts}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Reset Fails
                      </span>
                    </div>
                  </div>

                  {userDetail.lockedUntil && (
                    <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 mt-2">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>
                        Locked until:{" "}
                        {new Date(userDetail.lockedUntil).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Instant Status Toggles */}
                <div className="rounded-xl border border-border/60 p-4 space-y-3 bg-card">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    Security Policy Controls
                  </span>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Email Verified
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Manually toggle verified state for this user.
                      </p>
                    </div>
                    <Switch
                      checked={userDetail.emailVerified}
                      onCheckedChange={handleToggleEmailVerified}
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div>
                      <p className="font-semibold text-foreground">
                        Two-Factor Authentication (2FA)
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Enable or disable 2FA for this account.
                      </p>
                    </div>
                    <Switch
                      checked={userDetail.twoFactorEnabled}
                      onCheckedChange={handleToggleTwoFactor}
                      disabled={actionLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Active Sessions & Devices */}
            {activeTab === "sessions" && (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recorded Sessions
                  </span>
                  {userDetail.sessions && userDetail.sessions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRevokeSessions}
                      disabled={actionLoading}
                      className="h-6 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Revoke All Sessions
                    </Button>
                  )}
                </div>

                {userDetail.sessions && userDetail.sessions.length > 0 ? (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {userDetail.sessions.map((s) => {
                      const isRevoked = Boolean(s.revokedAt);
                      const isExpired = new Date(s.expiresAt) < new Date();
                      const isActive = !isRevoked && !isExpired;
                      const parsed = parseUserAgent(s.userAgent);

                      return (
                        <div
                          key={s.id}
                          className="p-3.5 rounded-xl border border-border/60 bg-card space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Laptop className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">
                                {parsed.browser} on {parsed.os}
                              </span>
                            </div>
                            {isActive ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-2 py-0.5 text-muted-foreground"
                              >
                                {isRevoked ? "Revoked" : "Expired"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>IP: {s.ipAddress || "127.0.0.1"}</span>
                            <span>
                              Accessed:{" "}
                              {new Date(s.accessedAt).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          {s.revokeReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                              Reason: {s.revokeReason}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-4 rounded-xl border border-dashed border-border/60 text-center">
                    No active sessions recorded for this user.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
