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
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersAction({
        search: search || undefined,
        role: roleFilter || undefined,
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
    let active = true;
    getUsersAction({
      role: roleFilter || undefined,
    })
      .then((res) => {
        if (!active) return;
        if (res.success && res.items) {
          setUsers(res.items);
        } else {
          toast.error(res.message);
        }
      })
      .catch(() => {
        if (active) toast.error("Failed to load portal users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [roleFilter]);

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

  const handleToggleLock = (userCode: string, isCurrentlyLocked: boolean) => {
    startTransition(async () => {
      const res = await toggleUserLockAction(userCode);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) =>
            u.code === userCode
              ? {
                  ...u,
                  lockedUntil: !isCurrentlyLocked
                    ? new Date(Date.now() + 3600000).toISOString()
                    : null,
                }
              : u,
          ),
        );
      } else {
        toast.error(res.message);
      }
    });
  };

  const getRoleBadge = (userRole: WhiteLabelUserRole) => {
    switch (userRole) {
      case WhiteLabelUserRole.OWNER:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-mono font-bold"
          >
            OWNER
          </Badge>
        );
      case WhiteLabelUserRole.PARTNER:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-mono font-bold"
          >
            PARTNER
          </Badge>
        );
      case WhiteLabelUserRole.ADMIN:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-mono font-bold"
          >
            ADMIN
          </Badge>
        );
      case WhiteLabelUserRole.MANAGER:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono font-bold"
          >
            MANAGER
          </Badge>
        );
      case WhiteLabelUserRole.STAFF:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-mono font-bold"
          >
            STAFF
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-[10px] bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20 font-mono"
          >
            CLIENT / ARTIST
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
            <span>Roster &amp; Team Management</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your label administrators, artists, and portal members
            matching your WhiteLabel tenant authority.
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
            className="text-xs gap-1.5 h-8.5 font-semibold"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Member</span>
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
            placeholder="Search roster members by name or email..."
            className="pl-8 text-xs h-8.5"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
          className="h-8.5 px-3 rounded-lg border border-input bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
        >
          <option value="">All Roles</option>
          <option value="OWNER">Owner</option>
          <option value="PARTNER">Partner</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
          <option value="CLIENT">Client / Artist</option>
        </select>
      </div>

      {/* Users Table Card */}
      <Card className="border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="p-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Portal Roster ({users.length})
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
              No members found matching your filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableHead className="text-xs">
                    Member Name &amp; Code
                  </TableHead>
                  <TableHead className="text-xs">Email Address</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Security</TableHead>
                  <TableHead className="text-xs">Joined</TableHead>
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
                          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
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
                                  className="text-[9px] px-1 py-0 h-4"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {u.code}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                            <ShieldCheck className="h-3 w-3" />
                            2FA Active
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            Password Only
                          </span>
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
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  handleRoleChange(
                                    u.code,
                                    e.target.value as WhiteLabelUserRole,
                                  )
                                }
                                disabled={isPending}
                                aria-label="Change user role"
                                className="h-7 px-2 text-[11px] rounded border border-input bg-card text-foreground focus:outline-none"
                              >
                                <option value="OWNER">Owner</option>
                                <option value="PARTNER">Partner</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="STAFF">Staff</option>
                                <option value="CLIENT">Client / Artist</option>
                              </select>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleToggleLock(u.code, Boolean(isLocked))
                                }
                                disabled={isPending}
                                className={`h-7 px-2 text-xs ${
                                  isLocked
                                    ? "text-emerald-500 hover:text-emerald-600"
                                    : "text-muted-foreground hover:text-destructive"
                                }`}
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

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  <span>Add Roster Member</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Invite a new artist or team partner to{" "}
                  {tenant?.name || "the portal"}.
                </CardDescription>
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
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-foreground">
                      First Name
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
                      Last Name
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
                    Email Address
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
                  <Label className="text-xs font-semibold text-foreground">
                    Temporary Password
                  </Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="text-xs h-8.5"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-foreground">
                    Assigned Role
                  </Label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as WhiteLabelUserRole)
                    }
                    className="w-full h-8.5 px-3 rounded-lg border border-input bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CLIENT">Client / Artist</option>
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="PARTNER">Partner</option>
                  </select>
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
                  className="text-xs h-8.5 font-semibold gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isPending ? (
                    <>
                      <Spinner className="h-3.5 w-3.5" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Create Member</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
