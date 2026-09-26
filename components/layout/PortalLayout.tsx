// PortalLayout — app shell for authenticated pages.
// Wraps the shadcn SidebarProvider: AppSidebar on the left, content in
// SidebarInset with a slim top bar carrying the SidebarTrigger. Replaces
// the old TopNav horizontal navigation.

"use client";

import Image from "next/image";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <span className="flex items-center gap-2 md:hidden">
            <Image
              src="/clinic-logo.jpg"
              alt="Shwe Taw Win Dental Clinic"
              width={24}
              height={24}
              className="h-6 w-6 rounded object-cover"
            />
            <span className="text-sm font-bold text-foreground">
              Shwe Taw Win Dental Clinic
            </span>
          </span>
        </header>
        <main className="mx-auto w-full max-w-300 px-8 py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
