"use client";

import { TopNav } from "@/components/layout/TopNav";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="px-8 py-8 max-w-[1200px] mx-auto">
        {children}
      </main>
    </div>
  );
}
