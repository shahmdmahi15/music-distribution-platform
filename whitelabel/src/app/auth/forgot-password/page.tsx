"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/actions/auth/request-password-reset.action";
import { useTenant } from "@/components/tenant-theme-provider";
import {
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const tenant = useTenant();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const res = await requestPasswordResetAction({ email });
      if (res.success) {
        setSubmitted(true);
        toast.success(res.message);
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    });
  };

  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  return (
    <Card className="shadow-2xl border-border/80 bg-card/90 backdrop-blur-xl">
      <CardHeader className="p-4 sm:p-5 pb-2.5 sm:pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            <KeyRound className="h-3 w-3" />
            <span>Account Recovery</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {tenant?.code || "Portal"}
          </span>
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Reset Password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your registered email address to receive password recovery
          instructions.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-5 py-2 space-y-4">
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 mb-1">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Check Your Inbox
            </h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              If an account with{" "}
              <span className="font-semibold text-foreground">{email}</span>{" "}
              exists, we have sent instructions to reset your password.
            </p>
            <div className="pt-3">
              <Button
                render={<Link href="/auth/login" />}
                variant="outline"
                className="w-full h-9 text-xs font-semibold gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <Alert variant="destructive" className="py-2 px-3 text-xs">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="artist@label.com"
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-9 text-xs font-semibold gap-2 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {isPending ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    <span>Dispatching reset email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>
          </>
        )}
      </CardContent>

      <CardFooter className="px-4 sm:px-5 py-3 border-t border-border/50 flex flex-col items-center gap-2 bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-foreground hover:underline"
          >
            Sign in here
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
