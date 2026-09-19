"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/auth/request-password-reset.action";
import { useTenant } from "@/components/tenant-theme-provider";
import { Music, ArrowRight, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const tenant = useTenant();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestPasswordResetAction({ email });
      setSubmitted(true);
      toast.success(res.message);
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
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Enter your email to receive password reset instructions
          </p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xl">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold">Check Your Inbox</h2>
              <p className="text-sm text-muted-foreground">
                If the email is registered, we have sent instructions to reset your password.
              </p>
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="text-xs font-semibold text-foreground hover:underline"
                >
                  ← Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@label.com"
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3">
                <Link
                  href="/auth/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
