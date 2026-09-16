// Middleware — role-based route protection.
// Unauthenticated users → /login.
// ADMIN → /admin/*, ASSISTANT → /assistant/*.
// Mismatched role → redirect to correct dashboard.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function getUserRole(
  supabase: ReturnType<typeof createServerClient>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role ?? null;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const role = await getUserRole(supabase);
  const pathname = request.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isAssistantRoute = pathname.startsWith("/assistant");

  if (!role && (isAdminRoute || isAssistantRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role && pathname === "/login") {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin" : "/assistant", request.url)
    );
  }

  if (role === "ADMIN" && isAssistantRoute) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (role === "ASSISTANT" && isAdminRoute) {
    return NextResponse.redirect(new URL("/assistant", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/assistant/:path*", "/login"],
};
