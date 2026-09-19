"use client";

import React, { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { passwordResetAction } from "@/actions/auth/password-reset.action";
import { useTenant } from "@/components/tenant-theme-provider";
import { Music, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const tenant = useTenant();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage("Missing reset token in URL.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await passwordResetAction({ token, password });
      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      toast.success("Password reset successfully! Please sign in.");
      router.push("/auth/login");
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
            >
              <Music className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Password</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Choose a secure password for your portal account
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xl">
          {errorMessage && (
            <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-semibold text-sm text-white shadow-md transition-all hover:opacity-95 disabled:opacity-50 mt-2"
              style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[80vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

