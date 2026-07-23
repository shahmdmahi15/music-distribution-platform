import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { meAction } from "@/actions/auth/me";
import { Role } from "@/types/user";

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF];

export default async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const session = await meAction(sessionToken);

  const isAuthenticated = session.success && !!session.user;
  const userRole = session.user?.role;

  const hasAdminPanelAccess = userRole ? ADMIN_ROLES.includes(userRole) : false;
  // Client panel is CLIENT-only now — admins do NOT get client panel access.
  const hasClientPanelAccess = userRole === Role.CLIENT;

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = !isAuthRoute && !isAdminRoute;

  // Authenticated user hitting an auth route (login/register/etc.)
  if (isAuthenticated && isAuthRoute) {
    if (hasAdminPanelAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (hasClientPanelAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Authenticated but no valid role/panel access at all — this session
    // is effectively broken. Clear the bad cookie instead of redirecting
    // anywhere, or we risk looping back through this same branch.
    const response = NextResponse.next();
    response.cookies.delete("__Host-SESSION_TOKEN");
    return response;
  }

  // Not authenticated and trying to access anything other than /auth/*
  if (!isAuthenticated && !isAuthRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated, on an admin route, but lacks admin access
  if (isAuthenticated && isAdminRoute && !hasAdminPanelAccess) {
    if (hasClientPanelAccess) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // No access anywhere — route through /auth/login, which will clear
    // the broken session on the next pass (see isAuthRoute branch above).
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Authenticated, on a client route, but lacks client access
  if (isAuthenticated && isClientRoute && !hasClientPanelAccess) {
    if (hasAdminPanelAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // No access anywhere — same as above, resolves via the auth-route
    // branch instead of looping.
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|favicon.ico|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)",
  ],
};
