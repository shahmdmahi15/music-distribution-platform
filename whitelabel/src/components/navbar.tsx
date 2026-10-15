/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTenant, useCurrentUser } from "./tenant-theme-provider";
import { TenantLogo } from "./tenant-logo";
import { logoutAction } from "@/actions/auth/logout.action";
import { WhiteLabelUserRole } from "@/types/user";
import { Music, Users, Smartphone, LogOut, Moon, Sun, FileText, Menu, X, User } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export function Navbar() {
  const tenant = useTenant();
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
        window.location.href = "/auth/login";
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

  const navbarStyle =
    tenant?.theme?.navbarStyle || tenant?.navbarStyle || "glass";
  const primaryColor =
    tenant?.theme?.primaryColor || tenant?.primaryColor || "#6366f1";

  const isFloating = navbarStyle === "floating";
  const isSolid = navbarStyle === "solid";

  return (
    <header
      className={
        isFloating
          ? "sticky top-3 z-40 max-w-7xl mx-auto px-4 w-full transition-all duration-200"
          : isSolid
            ? "sticky top-0 z-40 w-full border-b border-border bg-background shadow-xs transition-all duration-200"
            : "sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-200"
      }
    >
      <div
        className={
          isFloating
            ? "flex h-16 items-center justify-between px-4 sm:px-6 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-md shadow-lg"
            : "max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6"
        }
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg tracking-tight"
          >
            <TenantLogo
              tenant={tenant}
              className="h-8 w-auto object-contain rounded"
            />
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
                href="/releases"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/releases")
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Music className="w-4 h-4" />
                Releases
              </Link>
              <Link
                href="/reports"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/reports")
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Reports
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
        <div className="flex items-center gap-2 sm:gap-3">
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
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Link with Role badge & user info */}
              <Link
                href="/profile"
                className={`flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg transition-colors ${
                  pathname === "/profile"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60"
                }`}
                title="View Profile"
              >
                <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center border border-border text-foreground">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium leading-none">
                    {user.firstName} {user.lastName}
                  </span>
                  <span
                    className={`mt-1 text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                      user.role,
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </Link>

              {/* Sign out button */}
              <button
                onClick={handleLogout}
                disabled={isPending}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
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
                style={{ backgroundColor: primaryColor }}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/releases"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname.startsWith("/releases")
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Music className="w-4 h-4" />
            Releases
          </Link>
          <Link
            href="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname.startsWith("/reports")
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <FileText className="w-4 h-4" />
            Reports
          </Link>
          <Link
            href="/sessions"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                pathname === "/users"
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <Users className="w-4 h-4" />
              Team & Users
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
              pathname === "/profile"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </Link>
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              disabled={isPending}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
