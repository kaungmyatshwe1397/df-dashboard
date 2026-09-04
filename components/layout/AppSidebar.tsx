"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  PlusCircle,
  FlaskConical,
  Calculator,
  CalendarCheck,
  Lock,
  LogOut,
  Users,
  Key,
} from "lucide-react";
import { UserRole } from "@/lib/global";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PasswordChangeDialog } from "@/components/users-table/passwordChangeDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const assistantNavItems: NavItem[] = [
  { title: "Record Table", href: "/assistant", icon: TableProperties },
  { title: "Add Entry", href: "/assistant#add", icon: PlusCircle },
];

const adminNavItems: NavItem[] = [
  { title: "Records", href: "/admin/records", icon: TableProperties },
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Lab Reconciliation", href: "/admin/reconciliation", icon: FlaskConical },
  { title: "Overhead", href: "/admin/overhead", icon: Calculator },
  { title: "Closeout", href: "/admin/closeout", icon: CalendarCheck },
  { title: "Users", href: "/admin/users", icon: Users },
];

interface AppSidebarProps {
  cycleLocked?: boolean;
}

export function AppSidebar({ cycleLocked = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const navItems = isAdmin ? adminNavItems : assistantNavItems;
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            DC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              DC-FMS
            </span>
            <span className="text-xs text-muted-foreground">
              Financial Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdmin ? "Admin Portal" : "Assistant Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/assistant" || item.href === "/admin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href + "/") || pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {cycleLocked && (
          <>
            <Separator />
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Cycle Locked</span>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">
                  {user?.username}
                </span>
                <Badge variant="secondary" className="mt-1 w-fit text-xs">
                  {user?.role}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPasswordDialogOpen(true)}
                  title="Change password"
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={logout}
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </Sidebar>
  );
}
