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
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border bg-background px-4">
          <SidebarTrigger />
          <span className="flex min-w-0 items-center gap-2 md:hidden">
            <Image
              src="/clinic-logo.jpg"
              alt="Shwe Taw Win Dental Clinic"
              width={24}
              height={24}
              className="h-6 w-6 rounded object-cover"
            />
            <span className="min-w-0 text-body-sm font-bold text-foreground">
              Shwe Taw Win Dental Clinic
            </span>
          </span>
        </header>
        <main className="mx-auto min-w-0 w-full max-w-300 px-3 py-4 sm:px-5 lg:px-8 lg:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
