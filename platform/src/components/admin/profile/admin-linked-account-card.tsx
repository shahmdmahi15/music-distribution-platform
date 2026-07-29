"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Mail, Check } from "lucide-react";

interface LinkedAccountStatusProps {
  linkedAccounts?: { password: boolean; google: boolean; github: boolean };
}

export function AdminLinkedAccountCard({
  linkedAccounts,
}: LinkedAccountStatusProps) {
  return (
    <Card className="shadow-sm border-border/60 flex flex-col justify-between">
      <div>
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Link2 className="h-5 w-5" />
            <CardTitle className="text-xl font-bold tracking-tight">
              Linked Accounts
            </CardTitle>
          </div>
          <CardDescription>
            Manage your connected login methods and authentication providers.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email Password */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20 gap-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Email Password
                </p>
                <p className="text-xs text-muted-foreground">
                  Standard login using email and password
                </p>
              </div>
            </div>

            <div className="self-end sm:self-auto">
              {linkedAccounts?.password ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1.5 px-3 font-semibold text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Linked
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9 px-4 text-xs font-medium"
                >
                  Link
                </Button>
              )}
            </div>
          </div>

          {/* Google */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20 gap-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Google
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect your Google account for OAuth sign-in
                </p>
              </div>
            </div>

            <div className="self-end sm:self-auto">
              {linkedAccounts?.google ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1.5 px-3 font-semibold text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Linked
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="cursor-pointer h-9 px-4 text-xs font-medium"
                >
                  Unavailable
                </Button>
              )}
            </div>
          </div>

          {/* Github */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20 gap-3 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-background border border-border/60 flex items-center justify-center shrink-0 shadow-2xs text-foreground">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none text-foreground">
                  Github
                </p>
                <p className="text-xs text-muted-foreground">
                  Connect your GitHub account for developer sign-in
                </p>
              </div>
            </div>

            <div className="self-end sm:self-auto">
              {linkedAccounts?.github ? (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1.5 px-3 font-semibold text-xs"
                >
                  <Check className="h-3.5 w-3.5" />
                  Linked
                </Badge>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="cursor-pointer h-9 px-4 text-xs font-medium"
                >
                  Unavailable
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
