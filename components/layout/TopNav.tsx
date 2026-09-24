// TopNav — horizontal navigation bar replacing the sidebar.
// Shows brand, nav tabs, and user avatar with dropdown menu.

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/supabase/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AccountSettingsModal } from "@/components/settings/AccountSettingsModal";
import { LogOut, Settings } from "lucide-react";

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
  const router = useRouter();
  const { profile } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");
  const navItems = isAdmin ? adminNavItems : assistantNavItems;

  const userInitial = profile?.username?.[0]?.toUpperCase() ?? "U";
  const displayName = profile?.username ?? "User";
  const displayEmail = profile?.email ?? "";

  function isActive(href: string) {
    if (href === "/admin" || href === "/assistant") return pathname === href;
    return pathname.startsWith(href + "/") || pathname === href;
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Image
            src="/clinic-logo.jpg"
            alt="Shwe Taw Win Dental Clinic"
            width={24}
            height={24}
            className="h-6 w-6 rounded object-cover"
            priority
          />
          <span className="text-sm font-bold text-foreground">Shwe Taw Win Dental Clinic</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="w-[30px] h-[30px] rounded-full bg-accent-dark text-accent flex items-center justify-center text-xs font-bold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              }
            >
              {userInitial}
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                    {displayEmail && (
                      <span className="text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    )}
                  </div>
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
        </div>
      </nav>

      <AccountSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
