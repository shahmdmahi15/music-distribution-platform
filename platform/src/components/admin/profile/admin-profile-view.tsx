"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Mail,
  KeyRound,
  Shield,
  User as UserIcon,
  Calendar,
  Clock,
  Copy,
  Check,
  UserPen,
  Camera,
  Link2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { AdminNameUpdateCard } from "./admin-name-update-card";
import { AdminImageUpdateCard } from "./admin-image-update-card";
import { AdminPasswordUpdateCard } from "./admin-password-update-card";
import { AdminLinkedAccountCard } from "./admin-linked-account-card";
import { Role } from "@/types/user";

interface AdminProfileViewProps {
  user: {
    id: string;
    code?: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    image?: string | null;
    emailVerified?: boolean;
    twoFactorEnabled?: boolean;
    isPasswordLinked?: boolean;
    createdAt?: string | Date;
    lastLoginAt?: string | Date | null;
  };
  linkedAccounts?: { password: boolean; google: boolean; github: boolean };
}

function formatDate(dateValue: string | Date | undefined) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getAccountAgeDays(createdAt: string | Date | undefined) {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

export function AdminProfileView({
  user,
  linkedAccounts,
}: AdminProfileViewProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "name" | "avatar" | "security" | "linked"
  >("overview");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fullName = `${user.firstName} ${user.lastName}`;
  const avatarFallback =
    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();
  const accountAge = getAccountAgeDays(user.createdAt);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const linkedCount = [
    linkedAccounts?.password,
    linkedAccounts?.google,
    linkedAccounts?.github,
  ].filter(Boolean).length;

  const handleExportProfileSummary = () => {
    const data = {
      userId: user.id,
      name: fullName,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      linkedAccounts,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin_profile_${user.id.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Profile summary exported.");
  };

  return (
    <div className="w-full space-y-6">
      {/* Hero Profile Header Banner */}
      <Card className="overflow-hidden shadow-sm border-border/60 bg-card">
        {/* Top Decorative Background Banner */}
        <div className="h-32 w-full bg-linear-to-r from-primary/20 via-primary/10 to-background border-b border-border/40 relative">
          <div className="absolute right-4 top-4 opacity-10">
            <Sparkles className="w-28 h-28 text-primary" />
          </div>
        </div>

        {/* Profile Avatar & Info Row */}
        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 mb-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => setActiveTab("avatar")}
            >
              <Avatar className="h-28 w-28 rounded-2xl border-4 border-background shadow-lg">
                <AvatarImage src={user.image || undefined} alt={fullName} />
                <AvatarFallback className="rounded-xl text-3xl font-bold bg-primary/10 text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="h-6 w-6" />
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs font-semibold gap-1.5 border-primary/30 bg-primary/5 text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {user.role}
              </Badge>

              {user.twoFactorEnabled ? (
                <Badge
                  variant="default"
                  className="px-3 py-1 text-xs font-semibold gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  2FA Protected
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-xs font-semibold gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  2FA Disabled
                </Badge>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportProfileSummary}
                className="h-7 text-xs gap-1"
              >
                <Download className="h-3 w-3" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 flex-wrap">
              <span>{fullName}</span>
              {user.code && (
                <Badge
                  variant="outline"
                  className="font-mono text-xs px-2 py-0.5 font-bold border-primary/40 bg-primary/10 text-primary"
                >
                  {user.code}
                </Badge>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {user.code && (
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground/70" />
                  <span className="font-mono font-semibold">{user.code}</span>
                  <button
                    onClick={() => copyToClipboard(user.code!, "User Code")}
                    className="hover:text-foreground transition-colors ml-0.5"
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

              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span>{user.email}</span>
                <button
                  onClick={() => copyToClipboard(user.email, "Email")}
                  className="hover:text-foreground transition-colors ml-0.5"
                  title="Copy Email"
                >
                  {copiedField === "Email" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="font-mono">{user.id.slice(0, 12)}...</span>
                <button
                  onClick={() => copyToClipboard(user.id, "User ID")}
                  className="hover:text-foreground transition-colors ml-0.5"
                  title="Copy User ID"
                >
                  {copiedField === "User ID" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stat Meters */}
        <Separator />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/20 text-center text-xs">
          <div className="p-2 space-y-0.5">
            <span className="text-muted-foreground">Account Age</span>
            <p className="font-bold text-base text-foreground">
              {accountAge} {accountAge === 1 ? "day" : "days"}
            </p>
          </div>
          <div className="p-2 space-y-0.5 border-l border-border/40">
            <span className="text-muted-foreground">Linked Providers</span>
            <p className="font-bold text-base text-foreground">
              {linkedCount}
            </p>
          </div>
          <div className="p-2 space-y-0.5 border-l border-border/40">
            <span className="text-muted-foreground">Email Status</span>
            <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">
              Verified
            </p>
          </div>
          <div className="p-2 space-y-0.5 border-l border-border/40">
            <span className="text-muted-foreground">Security Score</span>
            <p className="font-bold text-base text-primary">
              {user.twoFactorEnabled ? "100% (High)" : "75% (Standard)"}
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-border/60 overflow-x-auto pb-1 text-xs">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          <Shield className="h-3.5 w-3.5" />
          Overview & Account
        </Button>

        <Button
          variant={activeTab === "name" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("name")}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          <UserPen className="h-3.5 w-3.5" />
          Personal Details
        </Button>

        <Button
          variant={activeTab === "avatar" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("avatar")}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          <Camera className="h-3.5 w-3.5" />
          Profile Photo
        </Button>

        <Button
          variant={activeTab === "security" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("security")}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Security & Password
        </Button>

        <Button
          variant={activeTab === "linked" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("linked")}
          className="h-8 text-xs rounded-lg gap-1.5"
        >
          <Link2 className="h-3.5 w-3.5" />
          Linked Accounts
        </Button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                  Account Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* User Code */}
                  {user.code && (
                    <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-primary" />
                          User Code
                        </span>
                        <button
                          onClick={() => copyToClipboard(user.code!, "User Code")}
                          className="hover:text-foreground"
                          title="Copy User Code"
                        >
                          {copiedField === "User Code" ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </span>
                      <code className="text-xs font-mono font-bold text-primary truncate">
                        {user.code}
                      </code>
                    </div>
                  )}

                  {/* User ID */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-primary/70" />
                        User ID
                      </span>
                      <button
                        onClick={() => copyToClipboard(user.id, "User ID")}
                        className="hover:text-foreground"
                        title="Copy User ID"
                      >
                        {copiedField === "User ID" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                    <code className="text-xs font-mono font-semibold truncate text-foreground">
                      {user.id}
                    </code>
                  </div>

                  {/* Role */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary/70" />
                      Platform Role
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {user.role}
                    </span>
                  </div>

                  {/* First Name */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-primary/70" />
                      First Name
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {user.firstName || "N/A"}
                    </span>
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-primary/70" />
                      Last Name
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {user.lastName || "N/A"}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-muted/40 border border-border/50 md:col-span-2">
                    <span className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary/70" />
                        Email Address
                      </span>
                      <button
                        onClick={() => copyToClipboard(user.email, "Email")}
                        className="hover:text-foreground"
                        title="Copy Email"
                      >
                        {copiedField === "Email" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                  Activity & System Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <Calendar className="h-4 w-4 text-primary/70 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block">
                        Account Created
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                    <Clock className="h-4 w-4 text-primary/70 mt-0.5" />
                    <div>
                      <span className="text-xs font-medium text-muted-foreground block">
                        Last Login Timestamp
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never recorded"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "name" && (
        <div className="max-w-2xl">
          <AdminNameUpdateCard
            initialFirstName={user.firstName}
            initialLastName={user.lastName}
          />
        </div>
      )}

      {activeTab === "avatar" && (
        <div className="max-w-2xl">
          <AdminImageUpdateCard
            initialImage={user.image}
            userName={fullName}
          />
        </div>
      )}

      {activeTab === "security" && (
        <div className="max-w-2xl space-y-6">
          <AdminPasswordUpdateCard
            isPasswordLinked={
              linkedAccounts?.password !== undefined
                ? linkedAccounts.password
                : true
            }
          />
        </div>
      )}

      {activeTab === "linked" && (
        <div className="max-w-2xl">
          <AdminLinkedAccountCard linkedAccounts={linkedAccounts} />
        </div>
      )}
    </div>
  );
}
