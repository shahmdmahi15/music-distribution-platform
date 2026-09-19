"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant, useCurrentUser } from "./tenant-theme-provider";
import { logoutAction } from "@/actions/auth/logout.action";
import { WhiteLabelUserRole } from "@/types/user";
import {
  Music,
  Shield,
  Users,
  Smartphone,
  LogOut,
  Moon,
  Sun,
  Layers,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function Navbar() {
  const tenant = useTenant();
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const isManagement =
    user?.role &&
    [
      WhiteLabelUserRole.OWNER,
      WhiteLabelUserRole.PARTNER,
      WhiteLabelUserRole.ADMIN,
      WhiteLabelUserRole.MANAGER,
    ].includes(user.role);

  const handleLogout = () => {
    startTransition(async () => {
      const res = await logoutAction();
      if (res.success) {
        toast.success("Signed out successfully");
        router.push("/auth/login");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const getRoleBadgeColor = (role?: WhiteLabelUserRole) => {
    switch (role) {
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
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-8 w-auto object-contain rounded"
              />
            ) : (
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-sm"
                style={{
                  backgroundColor:
                    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1",
                }}
              >
                <Music className="w-5 h-5" />
              </div>
            )}
            <span className="font-semibold hidden sm:inline-block">

              {tenant?.name || "Music Portal"}
            </span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/sessions"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/sessions"
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Sessions
              </Link>
              {isManagement && (
                <Link
                  href="/users"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    pathname === "/users"
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Team & Users
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Toggle Theme"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              {/* Role badge & user info */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium leading-none">
                  {user.firstName} {user.lastName}
                </span>
                <span
                  className={`mt-1 text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                    user.role,
                  )}`}
                >
                  {user.role}
                </span>
              </div>

              {/* Sign out button */}
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: tenant?.primaryColor || "#6366f1" }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
