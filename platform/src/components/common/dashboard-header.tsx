"use client";

import { User } from "@/types/user";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  Search,
  UserPen,
  ShieldPlus,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth/logout.action";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin Console",
  whitelabels: "WhiteLabel Instances",
  users: "User Directory",
  platform: "Platform Users",
  sessions: "Active Sessions",
  profile: "Profile & Settings",
  branding: "Brand Customizer",
  whitelabel: "WhiteLabel",
};

export function DashboardHeader({
  user,
  isAdmin = false,
}: {
  user?: User;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);

  const handleLogout = async () => {
    try {
      const result = await logoutAction();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.replace("/auth/login");
    } catch {
      toast.error("An error occurred while logging out.");
    }
  };

  const name = user ? `${user.firstName} ${user.lastName}` : "Account";
  const email = user?.email ?? "";
  const avatarFallback = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : "RM";

  const rootHref = isAdmin ? "/admin" : "/";
  const rootLabel = isAdmin ? "Admin" : "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md transition-[width,height] ease-linear">
      {/* Left side: Sidebar trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 h-8 w-8 hover:bg-accent/60 transition-colors" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-[orientation=vertical]:h-4"
        />

        <Breadcrumb className="hidden sm:flex text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link href={rootHref} />}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{rootLabel}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {segments.map((segment, index) => {
              // Skip root segment if it matches admin
              if (isAdmin && index === 0 && segment === "admin") return null;

              const isLast = index === segments.length - 1;
              const href = `/${segments.slice(0, index + 1).join("/")}`;
              const label =
                ROUTE_LABELS[segment.toLowerCase()] ||
                segment.charAt(0).toUpperCase() + segment.slice(1);

              return (
                <div key={href} className="flex items-center gap-1.5">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-semibold text-foreground">
                        {label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={href} />}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side: Search shortcut, Status pill, Theme toggle, and User Menu */}
      <div className="flex items-center gap-2">
        {/* Quick Search Trigger */}
        <button
          type="button"
          onClick={() => {
            toast.info("Global resource search palette initialized.");
          }}
          className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs text-muted-foreground bg-muted/40 hover:bg-muted/70 border border-border/60 rounded-md transition-all cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Quick search...</span>
          <kbd className="text-[9px] font-mono bg-background border border-border/80 px-1 py-0.2 rounded shadow-2xs text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* System Ecosystem Pill */}
        <Badge
          variant="outline"
          className="hidden lg:inline-flex items-center gap-1 text-[11px] font-medium border-primary/20 bg-primary/5 text-primary py-0.5 px-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {isAdmin ? "Global Network" : "Client Portal"}
        </Badge>

        <ThemeToggle />

        {/* User Dropdown Shortcut */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-accent/60 transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                />
              }
            >
              <Avatar className="h-7 w-7 rounded-md border border-border/60">
                <AvatarImage src={user.image || undefined} alt={name} />
                <AvatarFallback className="rounded-md font-bold text-xs bg-primary/10 text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-56 rounded-xl border border-border/80 shadow-lg"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 px-2.5 py-2">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image || undefined} alt={name} />
                      <AvatarFallback className="rounded-lg font-bold text-xs bg-primary/10 text-primary">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                      <span className="truncate font-bold text-foreground">
                        {name}
                      </span>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <div className="px-2.5 py-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    Access Role
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0"
                  >
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(isAdmin ? "/admin/profile" : "/profile")
                  }
                  className="cursor-pointer text-xs gap-2"
                >
                  <UserPen className="h-3.5 w-3.5" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(isAdmin ? "/admin/sessions" : "/sessions")
                  }
                  className="cursor-pointer text-xs gap-2"
                >
                  <ShieldPlus className="h-3.5 w-3.5" />
                  Active Sessions
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setLogoutOpen(true)}
                  className="cursor-pointer text-xs font-semibold gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Logout Alert Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
              <LogOut />
            </AlertDialogMedia>
            <AlertDialogTitle>Ready to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current session. You can sign back in anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
