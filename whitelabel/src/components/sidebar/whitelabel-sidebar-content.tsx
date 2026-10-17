"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Music,
  PlusCircle,
  Radio,
  FileText,
  Scale,
  Users,
  User,
  Smartphone,
} from "lucide-react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useCurrentUser } from "@/components/tenant-theme-provider";
import { WhiteLabelUserRole } from "@/types/user";

export function WhiteLabelSidebarContent() {
  const pathname = usePathname();
  const user = useCurrentUser();

  const isManagement =
    user?.role &&
    [
      WhiteLabelUserRole.OWNER,
      WhiteLabelUserRole.PARTNER,
      WhiteLabelUserRole.ADMIN,
      WhiteLabelUserRole.MANAGER,
    ].includes(user.role);

  return (
    <SidebarContent className="gap-2">
      {/* 1. Main Overview */}
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/"}
              tooltip="Dashboard"
              render={<Link href="/" />}
            >
              <LayoutDashboard className="size-4" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* 2. Catalog */}
      <SidebarGroup>
        <SidebarGroupLabel>Catalog</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/releases"}
                tooltip="All Releases"
                render={<Link href="/releases" />}
              >
                <Music className="size-4" />
                <span>All Releases</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/releases/new"}
                tooltip="New Release"
                render={<Link href="/releases/new" />}
              >
                <PlusCircle className="size-4" />
                <span>New Release</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* 3. Operations */}
      <SidebarGroup>
        <SidebarGroupLabel>Operations</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/channels")}
                tooltip="VEVO Channels"
                render={<Link href="/channels" />}
              >
                <Radio className="size-4 text-red-500" />
                <span>VEVO Channels</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* 4. Financials */}
      <SidebarGroup>
        <SidebarGroupLabel>Financials</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/reports")}
                tooltip="Royalty Reports"
                render={<Link href="/reports" />}
              >
                <FileText className="size-4" />
                <span>Royalty Reports</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/contracts")}
                tooltip="Split Contracts"
                render={<Link href="/contracts" />}
              >
                <Scale className="size-4" />
                <span>Split Contracts</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* 5. Team (Restricted to Manager+) */}
      {isManagement && (
        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/users"}
                  tooltip="Users Directory"
                  render={<Link href="/users" />}
                >
                  <Users className="size-4" />
                  <span>Users Directory</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* 6. Account */}
      <SidebarGroup className="mt-auto">
        <SidebarGroupLabel>Account</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/profile"}
                tooltip="Profile"
                render={<Link href="/profile" />}
              >
                <User className="size-4" />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/sessions"}
                tooltip="Active Sessions"
                render={<Link href="/sessions" />}
              >
                <Smartphone className="size-4" />
                <span>Active Sessions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
