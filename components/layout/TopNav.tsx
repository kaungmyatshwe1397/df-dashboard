// TopNav — horizontal navigation bar replacing the sidebar.
// Shows brand, nav tabs, and user avatar.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
}

const assistantNavItems: NavItem[] = [
  { title: "Records", href: "/assistant" },
];

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin" },
  { title: "Records", href: "/admin/records" },
  { title: "Lab Reconciliation", href: "/admin/reconciliation" },
  { title: "Overhead", href: "/admin/overhead" },
  { title: "Closeout", href: "/admin/closeout" },
  { title: "Users", href: "/admin/users" },
];

export function TopNav() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : assistantNavItems;

  function isActive(href: string) {
    if (href === "/admin" || href === "/assistant") return pathname === href;
    return pathname.startsWith(href + "/") || pathname === href;
  }

  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-sm font-bold text-foreground">DC-FMS</span>
      </div>

      <div className="flex items-center gap-1.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-2 rounded-lg text-[13px] transition-colors",
              isActive(item.href)
                ? "bg-input text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="w-[30px] h-[30px] rounded-full bg-accent-dark text-accent flex items-center justify-center text-xs font-bold">
          N
        </div>
      </div>
    </nav>
  );
}
