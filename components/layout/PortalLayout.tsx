"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

interface PortalLayoutProps {
  requiredRole: "ADMIN" | "ASSISTANT";
  children: React.ReactNode;
}

// Fallback redirect — middleware is the primary route guard.
export function PortalLayout({ requiredRole, children }: PortalLayoutProps) {
  const { isAuthenticated, isAdmin, isAssistant } = useAuth();
  const router = useRouter();

  const isWrongRole =
    (requiredRole === "ADMIN" && isAssistant) ||
    (requiredRole === "ASSISTANT" && isAdmin);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (isWrongRole) {
      router.push(requiredRole === "ADMIN" ? "/admin" : "/assistant");
    }
  }, [isAuthenticated, isWrongRole, requiredRole, router]);

  if (!isAuthenticated || isWrongRole) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
