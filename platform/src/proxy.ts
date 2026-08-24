import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { meAction } from "@/actions/auth/me.action";
import { Role } from "@/types/user";

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF];

export default async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const session = await meAction(sessionToken);

  const isAuthenticated = session.success && !!session.user;
  const userRole = session.user?.role;

  const hasAdminPanelAccess = userRole ? ADMIN_ROLES.includes(userRole) : false;
  const hasClientPanelAccess = userRole === Role.CLIENT;

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/auth");
  const isAdminRoute = pathname.startsWith("/admin");
  const isClientRoute = !isAuthRoute && !isAdminRoute;

  // 1. Authenticated user attempting to access auth pages (login, register, reset, etc.)
  if (isAuthenticated && isAuthRoute) {
    if (hasAdminPanelAccess) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (hasClientPanelAccess) {
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
      return NextResponse.redirect(new URL("/", request.url));
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)",
  ],
};
