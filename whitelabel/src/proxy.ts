import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { meAction } from "@/actions/auth/me.action";
import { WL_SESSION_COOKIE } from "@/lib/auth-cookies";
import { WhiteLabelUserRole } from "@/types/user";

const MANAGEMENT_ROLES: WhiteLabelUserRole[] = [
  WhiteLabelUserRole.OWNER,
  WhiteLabelUserRole.PARTNER,
  WhiteLabelUserRole.ADMIN,
  WhiteLabelUserRole.MANAGER,
];

/**
 * Next.js 16 LTS Proxy boundary (replaces deprecated middleware.ts).
 * Enforces WhiteLabel portal authentication, session isolation, and staff RBAC.
 */
export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(WL_SESSION_COOKIE)?.value;
  const session = await meAction(sessionToken);

  const isAuthenticated = session.success && !!session.user;
  const userRole = session.user?.role;

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/auth");
  const isManagementRoute =
    pathname.startsWith("/users") || pathname.startsWith("/settings/team");
  const isNotConfiguredRoute = pathname.startsWith("/not-configured");

  // Bypass proxy checks for configuration status page
  if (isNotConfiguredRoute) {
    return NextResponse.next();
  }

  // 1. Authenticated user attempting to access auth pages (login, register, forgot-password)
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Unauthenticated user attempting to access protected application routes (except root / which displays setup wizard or redirects)
  if (!isAuthenticated && !isAuthRoute && pathname !== "/") {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Creator/Artist attempting to access team & administrative management routes
  if (isAuthenticated && isManagementRoute) {
    if (!userRole || !MANAGEMENT_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)",
  ],
};
