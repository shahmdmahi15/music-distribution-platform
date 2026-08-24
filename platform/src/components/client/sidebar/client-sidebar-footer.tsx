"use client";

import { User } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ChevronsUpDown,
  Sparkles,
  UserPen,
  ShieldPlus,
  LogOut,
  Shield,
} from "lucide-react";
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
import { useState } from "react";
import { logoutAction } from "@/actions/auth/logout.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ClientSidebarFooter({ user }: { user: User }) {
  const name = `${user.firstName} ${user.lastName}`;
  const email = user.email;
  const avatar = user.image;
  const avatarFallback = user.firstName.charAt(0) + user.lastName.charAt(0);
  const role = user.role;
  const code = user.code;

  const [logoutOpen, setLogoutOpen] = useState(false);
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const result = await logoutAction();

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.replace("/auth/login");
    } catch (error) {
      console.log("[Component.Client.Sidebar.Footer] Error: ", { error });
      toast.error("Internal Form Error");
    }
  };

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar || undefined} alt={name} />
                    <AvatarFallback className="rounded-lg font-bold bg-primary/10 text-primary">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold text-foreground">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-xl"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-lg">
                      <AvatarImage src={avatar || undefined} alt={name} />
                      <AvatarFallback className="rounded-lg font-bold bg-primary/10 text-primary">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-bold text-foreground">{name}</span>
                        {code && (
                          <Badge
                            variant="outline"
                            className="font-mono text-[9px] px-1 py-0 font-medium"
                          >
                            {code}
                          </Badge>
                        )}
                      </div>
                      <span className="truncate text-xs text-muted-foreground">{email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer text-xs">
                  <UserPen className="h-3.5 w-3.5" />
                  Profile & Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/sessions")} className="cursor-pointer text-xs">
                  <ShieldPlus className="h-3.5 w-3.5" />
                  Active Sessions
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setLogoutOpen(true)}
                  className="cursor-pointer text-xs font-semibold"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Logout Alert Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <LogOut />
            </AlertDialogMedia>
            <AlertDialogTitle>Ready to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will end your current session. You can log back in at any time.
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
    </SidebarFooter>
  );
}
