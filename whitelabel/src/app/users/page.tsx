"use client";

import React, { useEffect, useState, useTransition } from "react";
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
  Shield,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Mail,
  User,
  Key,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function UsersManagementPage() {
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
  const [role, setRole] = useState<WhiteLabelUserRole>(WhiteLabelUserRole.CLIENT);

  const loadUsers = async () => {
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
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
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
        password: password || undefined,
        role,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setShowAddModal(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      loadUsers();
    });
  };

  const handleRoleChange = (code: string, newRole: string) => {
    startTransition(async () => {
      const res = await updateUserRoleAction(code, newRole);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) =>
            u.code === code ? { ...u, role: newRole as WhiteLabelUserRole } : u,
          ),
        );
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleToggleLock = (code: string) => {
    startTransition(async () => {
      const res = await toggleUserLockAction(code);
      if (res.success) {
        toast.success(res.message);
        loadUsers();
      } else {
        toast.error(res.message);
      }
    });
  };

  const getRoleBadgeColor = (r: WhiteLabelUserRole) => {
    switch (r) {
      case WhiteLabelUserRole.OWNER:
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case WhiteLabelUserRole.PARTNER:
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case WhiteLabelUserRole.ADMIN:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case WhiteLabelUserRole.MANAGER:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case WhiteLabelUserRole.STAFF:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Team & Portal Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, assign permissions, and oversee security in {tenant?.name || "this portal"}.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-md transition-all hover:opacity-95 self-start sm:self-auto"
          style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or user code..."
            className="w-full bg-card border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-card border border-border/60 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-muted-foreground"
        >
          <option value="">All Roles</option>
          {Object.values(WhiteLabelUserRole).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="p-2.5 rounded-xl border border-border/60 hover:bg-accent transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">2FA</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No users found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLocked =
                    u.lockedUntil && new Date(u.lockedUntil) > new Date();

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-sm">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                        {u.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.code, e.target.value)}
                          disabled={
                            isPending ||
                            (u.role === WhiteLabelUserRole.OWNER &&
                              currentUser?.role !== WhiteLabelUserRole.OWNER)
                          }
                          className={`font-semibold uppercase text-[10px] tracking-wider px-2 py-1 rounded border ${getRoleBadgeColor(
                            u.role,
                          )} bg-transparent cursor-pointer`}
                        >
                          {Object.values(WhiteLabelUserRole).map((r) => (
                            <option key={r} value={r} className="bg-card text-foreground">
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            <Lock className="w-3 h-3" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.twoFactorEnabled ? (
                          <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleToggleLock(u.code)}
                            disabled={isPending}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isLocked
                                ? "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                : "border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10"
                            }`}
                            title={isLocked ? "Unlock user" : "Lock user"}
                          >
                            {isLocked ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <h3 className="font-bold text-lg">Add Portal User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@label.com"
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Initial Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as WhiteLabelUserRole)}
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.values(WhiteLabelUserRole).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Password (optional, autogenerated if blank)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for auto-generated"
                  className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border/80 hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
                >
                  {isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
