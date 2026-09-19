"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/actions/auth/register.action";
import { useTenant } from "@/components/tenant-theme-provider";
import { Music, ArrowRight, User, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const tenant = useTenant();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await registerAction({
        firstName,
        lastName,
        email,
        password,
      });

      if (!res.success) {
        setErrorMessage(res.message);
        toast.error(res.message);
        return;
      }

      setSuccess(true);
      toast.success(res.message || "Registration successful!");
    });
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        {/* Card Header & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-12 w-auto object-contain rounded-lg"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
              >
                <Music className="w-7 h-7" />
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Join {tenant?.name || "Music Portal"} distribution network
          </p>
        </div>

        {/* Card Body */}
        <div className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Registration Completed!</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Your portal account has been created. You can now proceed to sign in.
              </p>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-6 font-semibold text-sm text-white shadow-md transition-all hover:opacity-95"
                  style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
                >
                  Proceed to Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="mb-6 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                  <span className="font-semibold">Error:</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@label.com"
                      className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters (a-z, A-Z, 0-9)"
                      className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 font-semibold text-sm text-white shadow-md transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 mt-2"
                  style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Register
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-foreground hover:underline"
                >
                  Sign in here
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
