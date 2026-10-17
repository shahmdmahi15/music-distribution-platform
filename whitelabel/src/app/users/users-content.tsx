"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import { getUsersAction } from "@/actions/users/get-users.action";
import {
  createUserAction,
  updateUserRoleAction,
  toggleUserLockAction,
} from "@/actions/users/manage-users.action";
import { WhiteLabelUser, WhiteLabelUserRole } from "@/types/user";
import { useCurrentUser, useTenant } from "@/components/tenant-theme-provider";
import {
  Users,
  UserPlus,
  Search,
  Lock,
  Unlock,
  RefreshCw,
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Owner" },
  { value: "PARTNER", label: "Partner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "CLIENT", label: "Client / Artist" },
];

const FILTER_ROLE_ITEMS = {
  ALL: "All Roles",
  OWNER: "Owner",
  PARTNER: "Partner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
  CLIENT: "Client / Artist",
};

const INVITE_ROLE_OPTIONS = [
  { value: "CLIENT", label: "Client / Artist" },
  { value: "STAFF", label: "Staff" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
  { value: "PARTNER", label: "Partner" },
];

export function UsersContent() {
  const currentUser = useCurrentUser();
  const tenant = useTenant();

  const [users, setUsers] = useState<WhiteLabelUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New User Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<WhiteLabelUserRole>(
    WhiteLabelUserRole.CLIENT,
  );
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Lock Confirmation Dialog State
  const [lockTargetUser, setLockTargetUser] = useState<{
    code: string;
    name: string;
    isLocked: boolean;
  } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersAction({
        search: search || undefined,
        role: roleFilter && roleFilter !== "ALL" ? roleFilter : undefined,
      });
      if (res.success && res.items) {
        setUsers(res.items);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to load portal users.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction({
        firstName,
        lastName,
        email,
        password,
        role,
      });
      if (res.success) {
        toast.success(res.message);
        setShowAddModal(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        loadUsers();
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleCopyInviteSnippet = () => {
    const portalDomain = tenant?.customDomain || (tenant?.subdomain ? `${tenant.subdomain}.rmit.com` : "https://portal.rmit.com");
    const snippet = `Welcome to ${tenant?.name || "WhiteLabel Music Portal"}!
Portal URL: https://${portalDomain}
Email: ${email || "user@example.com"}
Temporary Password: ${password || "GeneratePassword123!"}
Assigned Role: ${role}
Please log in and immediately configure Two-Factor Authentication (2FA).`;

    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    toast.success("Temporary credentials and invite snippet copied to clipboard!");
    setTimeout(() => setCopiedSnippet(false), 3000);
  };

  const handleRoleChange = (userCode: string, newRole: WhiteLabelUserRole) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(userCode, newRole);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u.code === userCode ? { ...u, role: newRole } : u)),
        );
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleConfirmToggleLock = () => {
    if (!lockTargetUser) return;
    const { code, isLocked } = lockTargetUser;

    startTransition(async () => {
      const res = await toggleUserLockAction(code);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) =>
            u.code === code
              ? {
                  ...u,
                  lockedUntil: !isLocked
                    ? new Date(Date.now() + 3600000).toISOString()
                    : null,
                }
              : u,
          ),
        );
        setLockTargetUser(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Semantic color-coded role badges
  const getRoleBadge = (userRole: WhiteLabelUserRole | string) => {
    const r = (userRole || "").toUpperCase();
    switch (r) {
      case "OWNER":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold text-[10px]">
            OWNER
          </Badge>
        );
      case "PARTNER":
        return (
          <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-mono font-bold text-[10px]">
            PARTNER
          </Badge>
        );
      case "ADMIN":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-mono font-bold text-[10px]">
            ADMIN
          </Badge>
        );
      case "MANAGER":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px]">
            MANAGER
          </Badge>
        );
      case "STAFF":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono font-bold text-[10px]">
            STAFF
          </Badge>
        );
      case "CLIENT":
      default:
        return (
          <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30 font-mono font-medium text-[10px]">
            CLIENT
          </Badge>
        );
    }
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card shadow-xs">
        <div>
          <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-primary" />
            <span>Team &amp; Roster Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your administrators, sub-labels, and signed artists under this WhiteLabel tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading || isPending}
            className="text-xs gap-1.5 h-8.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="text-xs gap-1.5 h-8.5 font-semibold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Invite Member</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roster members by name, email, or code..."
            className="pl-8 text-xs h-8.5"
          />
        </form>

        <Select
          items={FILTER_ROLE_ITEMS}
          value={roleFilter || "ALL"}
          onValueChange={(val) => setRoleFilter(val === "ALL" ? "" : val || "")}
        >
          <SelectTrigger
            aria-label="Filter by role"
            className="h-8.5 px-3 rounded-lg border border-input bg-card text-foreground text-xs w-full sm:w-48"
          >
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="PARTNER">Partner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MANAGER">Manager</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="CLIENT">Client / Artist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table Card */}
      <Card className="border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Portal Roster Directory ({users.length})
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              Tenant Isolated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-6 w-6 text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              No members found matching your search filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs">Member Name &amp; Code</TableHead>
                  <TableHead className="text-xs">Email Address</TableHead>
                  <TableHead className="text-xs">Role Authority</TableHead>
                  <TableHead className="text-xs">2FA Security</TableHead>
                  <TableHead className="text-xs">Joined Date</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isLocked =
                    u.lockedUntil && new Date(u.lockedUntil) > new Date();
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <TableRow
                      key={u.id || u.code}
                      className="border-border/50 text-xs"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {u.firstName?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <span>
                                {u.firstName} {u.lastName}
                              </span>
                              {isSelf && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20"
                                >
                                  You
                                </Badge>
                              )}
                              {isLocked && (
                                <Badge
                                  variant="destructive"
                                  className="text-[9px] px-1 py-0 h-4 font-mono"
                                >
                                  LOCKED
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {u.code}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono">
                        {u.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        {u.twoFactorEnabled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 gap-1 text-[10px] font-semibold">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <ShieldCheck className="h-3 w-3" />
                            <span>2FA Verified</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 text-[10px]">
                            <ShieldAlert className="h-3 w-3" />
                            <span>Password Only</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "Active"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <>
                              <Select
                                items={ROLE_OPTIONS}
                                value={u.role}
                                onValueChange={(val) => {
                                  if (val) {
                                    handleRoleChange(
                                      u.code,
                                      val as WhiteLabelUserRole,
                                    );
                                  }
                                }}
                                disabled={isPending}
                              >
                                <SelectTrigger
                                  size="sm"
                                  aria-label="Change user role"
                                  className="h-7 px-2 text-[11px] rounded border border-input bg-card text-foreground w-28"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setLockTargetUser({
                                    code: u.code,
                                    name: `${u.firstName} ${u.lastName}`,
                                    isLocked: Boolean(isLocked),
                                  })
                                }
                                disabled={isPending}
                                className={`h-7 px-2 text-xs ${
                                  isLocked
                                    ? "text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                                    : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                }`}
                                title={isLocked ? "Unlock user account" : "Lock user account"}
                              >
                                {isLocked ? (
                                  <Unlock className="h-3.5 w-3.5" />
                                ) : (
                                  <Lock className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal with Temporary Credential Copy Snippet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>Invite Roster Member</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate temporary credentials for {tenant?.name || "the portal"}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <form onSubmit={handleCreateUser}>
              <CardContent className="p-4 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      First Name *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="text-xs h-8.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Last Name *
                    </Label>
                    <Input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="text-xs h-8.5"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@label.com"
                    className="text-xs h-8.5"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Temporary Password *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        const randomPass = "RM-" + Math.random().toString(36).slice(-8) + "!";
                        setPassword(randomPass);
                      }}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <Input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters (e.g. RM-k82x9a!q)"
                    className="text-xs font-mono h-8.5"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Assigned Role
                  </Label>
                  <Select
                    items={INVITE_ROLE_OPTIONS}
                    value={role}
                    onValueChange={(val) => {
                      if (val) setRole(val as WhiteLabelUserRole);
                    }}
                  >
                    <SelectTrigger className="w-full h-8.5 px-3 rounded-lg border border-input bg-card text-foreground text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVITE_ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temporary Credential Copy Snippet Preview */}
                <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <span>Onboarding Snippet:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyInviteSnippet}
                      className="h-6 px-2 text-[11px] gap-1 text-primary hover:bg-primary/10"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Snippet</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground bg-card/60 p-2 rounded-lg border border-border/50 truncate">
                    Email: {email || "user@example.com"} | Pass: {password || "••••••••"}
                  </div>
                </div>
              </CardContent>

              <div className="p-4 pt-2 border-t border-border/50 flex items-center justify-end gap-2 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs h-8.5"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs h-8.5 font-semibold gap-1.5 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isPending ? (
                    <>
                      <Spinner className="h-3.5 w-3.5" />
                      <span>Inviting...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Send Portal Invite</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Account Lock/Unlock Confirmation Dialog */}
      <Dialog open={Boolean(lockTargetUser)} onOpenChange={(open) => !open && setLockTargetUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Confirm Account Security Action</span>
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs text-muted-foreground">
            <p>
              Are you sure you want to{" "}
              <strong className="text-foreground">
                {lockTargetUser?.isLocked ? "unlock" : "lock"}
              </strong>{" "}
              the account for <strong className="text-foreground">{lockTargetUser?.name}</strong>?
            </p>
            {lockTargetUser?.isLocked ? (
              <p className="text-emerald-600 dark:text-emerald-400">
                Unlocking this account will restore immediate portal access and allow the user to authenticate again.
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400">
                Locking this account will instantly invalidate all active sessions and block portal login attempts until explicitly unlocked.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLockTargetUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant={lockTargetUser?.isLocked ? "default" : "destructive"}
              onClick={handleConfirmToggleLock}
              disabled={isPending}
              className="gap-1.5 font-semibold"
            >
              {lockTargetUser?.isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Confirm Unlock</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm Lock</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
