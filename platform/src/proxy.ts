import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { meAction } from "@/actions/auth/me.action";
import { Role } from "@/types/user";

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF];

/**
 * Next.js 16 LTS Proxy boundary (replaces deprecated middleware.ts).
 * Enforces unified authentication, administrative RBAC, and WhiteLabel tenant gates.
 */
export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const session = await meAction(sessionToken);

  const isAuthenticated = session.success && !!session.user;
  const user = session.user;
  const userRole = user?.role;

  const hasAdminPanelAccess = userRole ? ADMIN_ROLES.includes(userRole) : false;
  const hasClientPanelAccess = userRole === Role.CLIENT;

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isWhiteLabelRoute =
    pathname === "/whitelabel" || pathname.startsWith("/whitelabel/");
  const isClientRoute = !isAuthRoute && !isAdminRoute;

  // 1. Authenticated user attempting to access auth pages (login, register, reset, etc.)
  if (isAuthenticated && isAuthRoute) {
    if (hasAdminPanelAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (hasClientPanelAccess) {
      // If client has an approved, active WhiteLabel, route directly to console; otherwise to onboarding hub
      if (user?.isWhiteLabelActive) {
        return NextResponse.redirect(new URL("/whitelabel", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Broken session state — clean cookie safely
    const response = NextResponse.next();
    response.cookies.delete("__Host-SESSION_TOKEN");
    return response;
  }

  // 2. Unauthenticated user attempting to access protected application routes
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL("/auth/login", request.url);
    if (pathname !== "/" && pathname !== "/admin") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated client attempting to access admin routes without permission
  if (isAuthenticated && isAdminRoute && !hasAdminPanelAccess) {
    if (hasClientPanelAccess) {
      return NextResponse.redirect(
        new URL(user?.isWhiteLabelActive ? "/whitelabel" : "/", request.url),
      );
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 4. Authenticated admin attempting to access client routes
  if (isAuthenticated && isClientRoute && !hasClientPanelAccess) {
    if (hasAdminPanelAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 5. WhiteLabel Management Console Gate:
  // Clients MUST have an ACTIVE WhiteLabel subscription to access /whitelabel/* routes.
  // If the client is still in Onboarding, Pending Review, Rejected, or Waiting for Payment,
  // they are intercepted and redirected to the application status overview at `/`.
  if (isAuthenticated && isWhiteLabelRoute && hasClientPanelAccess) {
    if (!user?.isWhiteLabelActive) {
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
