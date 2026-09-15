"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TableProperties,
  PlusCircle,
  FlaskConical,
  Calculator,
  CalendarCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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

export function AppSidebar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : assistantNavItems;
  const portalLabel = isAdmin ? "Admin Portal" : "Assistant Portal";

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground text-sm font-bold">
            DC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-foreground">
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
          <SidebarGroupLabel>{portalLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin" || item.href === "/assistant"
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
      </SidebarContent>
    </Sidebar>
  );
}
