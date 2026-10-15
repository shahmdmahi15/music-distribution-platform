"use client";

import React, { useState, useTransition } from "react";
import { WhiteLabelUser, WhiteLabelTenant } from "@/types/user";
import { updateProfileAction } from "@/actions/auth/update-profile.action";
import { changePasswordAction } from "@/actions/auth/change-password.action";
import { toast } from "sonner";
import {
  User,
  Shield,
  Key,
  Calendar,
  Clock,
  Building2,
  Mail,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ProfileContentProps {
  user: WhiteLabelUser;
  tenant?: WhiteLabelTenant;
}

export function ProfileContent({ user: initialUser, tenant }: ProfileContentProps) {
  const [user, setUser] = useState<WhiteLabelUser>(initialUser);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [isUpdatingProfile, startUpdateProfile] = useTransition();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, startChangePassword] = useTransition();

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last names are required.");
      return;
    }

    startUpdateProfile(async () => {
      const res = await updateProfileAction({ firstName, lastName });
      if (res.success) {
        toast.success(res.message);
        if (res.user) {
          setUser((prev) => ({ ...prev, ...res.user }));
        }
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    startChangePassword(async () => {
      const res = await changePasswordAction({ currentPassword, newPassword });
      if (res.success) {
        toast.success(res.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message);
      }
    });
  };

  const primaryColor = tenant?.primaryColor || "#6366f1";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, credentials, and security preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Summary Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-tight">
                  {user.firstName} {user.lastName}
                </h3>
                <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-accent text-accent-foreground">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Last login {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span>2FA: {user.twoFactorEnabled ? "Active" : "Disabled"}</span>
              </div>
            </div>
          </div>

          {/* WhiteLabel Portal Details */}
          {tenant && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>Portal Details</span>
              </div>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Label:</span>{" "}
                  {tenant.name}
                </div>
                {tenant.subdomain && (
                  <div>
                    <span className="font-medium text-foreground">Domain:</span>{" "}
                    {tenant.customDomain || `${tenant.subdomain}.rmit.com`}
                  </div>
                )}
                {tenant.supportEmail && (
                  <div>
                    <span className="font-medium text-foreground">Support:</span>{" "}
                    {tenant.supportEmail}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile & Password Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Personal Information</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-border bg-accent/40 text-muted-foreground text-sm cursor-not-allowed"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Email address is managed by platform security and cannot be changed directly.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground mb-4">
              <Key className="w-4 h-4 text-muted-foreground" />
              <span>Change Password</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-border hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
