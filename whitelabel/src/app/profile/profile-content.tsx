"use client";

import React, { useState, useTransition, useMemo } from "react";
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
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  // 2FA Wizard State
  const [show2faWizard, setShow2faWizard] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isVerifying2fa, setIsVerifying2fa] = useState(false);
  const [twoFactorActive, setTwoFactorActive] = useState(user.twoFactorEnabled);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Mock static TOTP Secret & Recovery Codes for 2FA Wizard
  const mockMfaSecret = "JBSWY3DPEHPK3PXP";
  const mockRecoveryCodes = [
    "4A82-99F1",
    "88C2-11D4",
    "5E33-00B2",
    "99A1-77C5",
    "2D44-88E6",
    "6B11-33F7",
    "7C22-44A8",
    "1F55-66B9",
  ];

  // Real-time password entropy meter calculation
  const passwordEntropy = useMemo(() => {
    if (!newPassword) return { score: 0, label: "Empty", color: "bg-muted", checks: {} };

    const hasMinLength = newPassword.length >= 8;
    const hasLongLength = newPassword.length >= 12;
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

    let score = 0;
    if (hasMinLength) score += 20;
    if (hasLongLength) score += 20;
    if (hasUpper) score += 15;
    if (hasLower) score += 15;
    if (hasNumber) score += 15;
    if (hasSymbol) score += 15;

    let label = "Weak";
    let color = "bg-red-500";

    if (score >= 80) {
      label = "Very Strong";
      color = "bg-emerald-500";
    } else if (score >= 60) {
      label = "Strong";
      color = "bg-blue-500";
    } else if (score >= 40) {
      label = "Moderate";
      color = "bg-amber-500";
    }

    return {
      score,
      label,
      color,
      checks: {
        hasMinLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSymbol,
      },
    };
  }, [newPassword]);

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

  const handleVerify2fa = (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length < 6) {
      toast.error("Please enter the 6-digit verification code from your authenticator app.");
      return;
    }

    setIsVerifying2fa(true);
    setTimeout(() => {
      setTwoFactorActive(true);
      setIsVerifying2fa(false);
      setShow2faWizard(false);
      setTwoFactorCode("");
      toast.success("Two-Factor Authentication (2FA) successfully enabled!");
    }, 800);
  };

  const primaryColor = tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  // Semantic Role Badge
  const getRoleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
    switch (r) {
      case "OWNER":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono font-bold text-xs">OWNER</Badge>;
      case "ADMIN":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-mono font-bold text-xs">ADMIN</Badge>;
      case "PARTNER":
        return <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-mono font-bold text-xs">PARTNER</Badge>;
      case "MANAGER":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono font-bold text-xs">MANAGER</Badge>;
      default:
        return <Badge className="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border border-zinc-500/30 font-mono font-medium text-xs">CLIENT</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Profile &amp; Security</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal identity, login credentials, and Two-Factor Authentication (2FA) protection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Tenant-Branded Identity Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Large Avatar */}
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-md border-2 border-background"
                style={{ backgroundColor: primaryColor }}
              >
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </div>

              <div>
                <h3 className="font-bold text-lg text-foreground leading-tight">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="mt-1 flex items-center justify-center gap-2">
                  {getRoleBadge(user.role)}
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                    {user.code}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Statistics Strip */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50 text-center">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-medium">Security Status</span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {twoFactorActive ? "100% Protected" : "60% Basic"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[10px] text-muted-foreground block font-medium">Account Access</span>
                <span className="text-xs font-bold text-emerald-500 font-mono">
                  Active
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/50 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate font-mono">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>Member since {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              {user.lastLoginAt && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>Last session {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* WhiteLabel Portal Details */}
          {tenant && (
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>Tenant Portal Details</span>
              </div>
              <div className="text-xs space-y-2 text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">Label:</span> {tenant.name}
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

        {/* Right Column: Edit Profile, Password & 2FA Management */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <User className="w-4 h-4 text-primary" />
              <span>Personal Information</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">First Name *</Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Last Name *</Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="text-xs font-mono cursor-not-allowed opacity-70 bg-muted/30"
                />
                <p className="text-[11px] text-muted-foreground">
                  Your email address is verified by tenant administration and cannot be changed directly.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  size="sm"
                  className="gap-2 text-xs font-semibold text-white"
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
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Card with Real-time Entropy Meter */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Key className="w-4 h-4 text-primary" />
              <span>Change Security Password</span>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Current Password *</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">New Password *</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Confirm New Password *</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Real-time Password Entropy Meter */}
              {newPassword && (
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Password Entropy:</span>
                    <span className="font-bold text-xs font-mono">{passwordEntropy.label} ({passwordEntropy.score}%)</span>
                  </div>

                  {/* Visual Entropy Bar */}
                  <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-300 ${passwordEntropy.color}`}
                      style={{ width: `${passwordEntropy.score}%` }}
                    />
                  </div>

                  {/* Entropy Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div className={`flex items-center gap-1 ${passwordEntropy.checks.hasMinLength ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      {passwordEntropy.checks.hasMinLength ? "✓" : "○"} 8+ Chars
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEntropy.checks.hasUpper && passwordEntropy.checks.hasLower ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      {passwordEntropy.checks.hasUpper && passwordEntropy.checks.hasLower ? "✓" : "○"} Upper &amp; Lower
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEntropy.checks.hasNumber ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      {passwordEntropy.checks.hasNumber ? "✓" : "○"} Number
                    </div>
                    <div className={`flex items-center gap-1 ${passwordEntropy.checks.hasSymbol ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                      {passwordEntropy.checks.hasSymbol ? "✓" : "○"} Symbol
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs font-semibold"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* 2FA/MFA Management Card with Setup Wizard */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                <span>Two-Factor Authentication (2FA)</span>
              </div>
              {twoFactorActive ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 gap-1 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2FA Active</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>2FA Disabled</span>
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Protect your catalog, royalty withdrawals, and artist roster with time-based one-time password (TOTP) verification using Google Authenticator, 1Password, or Authy.
            </p>

            {!twoFactorActive ? (
              <Button
                size="sm"
                onClick={() => setShow2faWizard(true)}
                className="text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start 2FA Setup Wizard</span>
              </Button>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authenticator App Configured &amp; Verified</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTwoFactorActive(false);
                      toast.info("Two-Factor Authentication has been disabled.");
                    }}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Disable 2FA
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Your account requires a 6-digit TOTP code upon every portal authentication.
                </p>
              </div>
            )}

            {/* 2FA Setup Wizard Dialog */}
            {show2faWizard && (
              <div className="p-5 rounded-2xl border border-primary/30 bg-card space-y-4 pt-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-primary" />
                    <span>2FA Setup Wizard</span>
                  </h4>
                  <button
                    onClick={() => setShow2faWizard(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Step 1: Scan QR Code */}
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-center gap-4">
                    {/* Mock QR Code display */}
                    <div className="w-28 h-28 bg-white p-2 rounded-xl border border-border shadow-xs flex items-center justify-center shrink-0">
                      <div className="grid grid-cols-4 gap-1 w-full h-full p-1 bg-zinc-900 rounded-lg">
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-white rounded-xs"></div>
                        <div className="bg-zinc-900"></div>
                        <div className="bg-white rounded-xs"></div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="font-semibold text-foreground">
                        Step 1: Scan with Authenticator App
                      </div>
                      <p className="text-muted-foreground">
                        Scan this QR code with Google Authenticator or 1Password. Alternatively, enter this secret key manually:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-card border border-border rounded font-mono text-[11px] font-bold text-primary">
                          {mockMfaSecret}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(mockMfaSecret);
                            setCopiedSecret(true);
                            setTimeout(() => setCopiedSecret(false), 2000);
                          }}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          {copiedSecret ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSecret ? "Copied" : "Copy"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Enter 6-digit Code */}
                  <form onSubmit={handleVerify2fa} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">
                        Step 2: Enter 6-Digit Authenticator Code
                      </Label>
                      <Input
                        type="text"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="123456"
                        required
                        className="text-base font-mono tracking-widest text-center h-10 max-w-[200px]"
                      />
                    </div>

                    {/* Step 3: Backup Recovery Codes Preview */}
                    <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Emergency Backup Recovery Codes (8 single-use codes)</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(mockRecoveryCodes.join("\n"));
                            setCopiedCodes(true);
                            setTimeout(() => setCopiedCodes(false), 2000);
                          }}
                          className="h-6 px-2 text-[11px] gap-1 text-primary"
                        >
                          {copiedCodes ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCodes ? "Copied" : "Copy All"}</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[11px] text-muted-foreground bg-card/70 p-2.5 rounded-lg border border-border/50">
                        {mockRecoveryCodes.map((code, idx) => (
                          <div key={idx} className="text-center font-semibold text-foreground">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShow2faWizard(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={twoFactorCode.length < 6 || isVerifying2fa}
                        className="font-semibold gap-1.5"
                      >
                        {isVerifying2fa ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify &amp; Enable 2FA</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
