// Next.js middleware — refreshes session and enforces route-level auth + RBAC.
// Protected routes: /admin/* (ADMIN only), /assistant/* (authenticated users).

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const adminRoutes = ["/admin"];
const assistantRoutes = ["/assistant"];
const protectedRoutes = [...adminRoutes, ...assistantRoutes];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

function isAdminRoute(pathname: string) {
  return adminRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, role } = await updateSession(request);

  const { pathname } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return supabaseResponse;
  }

  // Unauthenticated — redirect to login.
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return Response.redirect(loginUrl);
  }

  // Non-admin hitting admin routes — redirect to assistant portal.
  if (isAdminRoute(pathname) && role !== "ADMIN") {
    const assistantUrl = request.nextUrl.clone();
    assistantUrl.pathname = "/assistant";
    return Response.redirect(assistantUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/assistant/:path*",
  ],
};
