// AppSidebar — left navigation for the authenticated portal.
// Nav items are derived from the current portal path so Assistant never sees
// financial sections. Footer holds the account menu (settings + logout).

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Calculator,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Settings,
  TableProperties,
  Users,
  UsersRound,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSettingsModal } from "@/components/settings/AccountSettingsModal";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/supabase/auth";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const assistantNavItems: NavItem[] = [
  { title: "Records", href: "/assistant", icon: TableProperties },
  { title: "Registered Patients", href: "/assistant/register-patients", icon: UsersRound },
];

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Records", href: "/admin/records", icon: TableProperties },
  { title: "Registered Patients", href: "/admin/register-patients", icon: UsersRound },
  {
    title: "Lab Reconciliation",
    href: "/admin/reconciliation",
    icon: FlaskConical,
  },
  { title: "Overhead", href: "/admin/overhead", icon: Calculator },
  { title: "Carry Forward", href: "/admin/carry-forward", icon: ArrowRightLeft },
  { title: "Users", href: "/admin/users", icon: Users },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin" || href === "/assistant") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : assistantNavItems;
  const portalLabel = isAdmin ? "Admin Portal" : "Assistant Portal";

  const userInitial = profile?.username?.[0]?.toUpperCase() ?? "U";
  const displayName = profile?.username ?? "User";
  const displayEmail = profile?.email ?? "";

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-1">
            <Image
              src="/clinic-logo.jpg"
              alt="Shwe Taw Win Dental Clinic"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight text-foreground">
                Shwe Taw Win Dental Clinic
              </span>
              <span className="text-xs text-muted-foreground">
                Financial Management
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{portalLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActivePath(pathname, item.href)}
                      tooltip={item.title}
                      render={
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" />
              }
            >
              <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-full bg-accent-dark text-xs font-bold text-accent">
                {userInitial}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </span>
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" sideOffset={8} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    {displayEmail && (
                      <span className="text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    )}
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="size-4" />
                Account Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut className="size-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <AccountSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
