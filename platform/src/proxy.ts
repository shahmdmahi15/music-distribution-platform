import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { meAction } from "@/actions/auth/me.action";
import { Role } from "@/types/user";

const ADMIN_ROLES: Role[] = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.STAFF];

const RESERVED_SUBDOMAINS = new Set([
  "platform",
  "api",
  "admin",
  "app",
  "auth",
  "mail",
  "status",
  "backstage",
  "staging",
  "dev",
  "test",
  "demo",
  "portal",
  "console",
  "dashboard",
  "billing",
  "account",
  "accounts",
  "pay",
  "payment",
  "payments",
  "static",
  "assets",
  "cdn",
  "ws",
  "wss",
  "root",
  "www",
]);

interface SubdomainResolutionResult {
  found: boolean;
  reserved?: boolean;
  id?: string;
  code?: string;
  name?: string;
  subdomain?: string;
  status?: string;
  customDomain?: string | null;
  backstageDomain?: string | null;
  logoUrl?: string | null;
  primaryColor?: string;
  message?: string;
}

/**
 * Next.js 16 LTS Proxy boundary (replaces deprecated middleware.ts).
 * Enforces:
 * 1. Subdomain multi-tenancy for *.platform.royalmotionit.com
 *    - Resolves whitelabel slug to backstage.customdomain (HTTP 307)
 *    - Shows holding view if custom domain pending
 *    - Returns 404 for unassigned/unknown subdomains
 * 2. Unified authentication, administrative RBAC, and WhiteLabel tenant gates on platform console
 */
export async function proxy(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(":")[0]
    .toLowerCase();

  const pathname = request.nextUrl.pathname;

  const isInternalSubdomainRoute =
    pathname === "/subdomain-holding" ||
    pathname === "/subdomain-not-found";

  const PLATFORM_DOMAIN = "platform.royalmotionit.com";
  const isSubdomainRequest =
    host.endsWith(`.${PLATFORM_DOMAIN}`) && host !== PLATFORM_DOMAIN;

  // =========================================================================
  // 1. WhiteLabel Subdomain Gateway (*.platform.royalmotionit.com)
  // =========================================================================
  if (isSubdomainRequest) {
    const subdomain = host.slice(0, -(PLATFORM_DOMAIN.length + 1)).trim();

    // Infrastructure bypass: api.platform.royalmotionit.com
    if (subdomain === "api" || subdomain === "platform") {
      return NextResponse.next();
    }

    // Allow internal rewrite targets to render
    if (isInternalSubdomainRoute) {
      return NextResponse.next();
    }

    // Reject reserved infrastructure subdomains that are not whitelabels
    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      const notFoundUrl = new URL("/subdomain-not-found", request.url);
      notFoundUrl.searchParams.set("subdomain", subdomain);
      return NextResponse.rewrite(notFoundUrl, { status: 404 });
    }

    // Query Central API for tenant resolution
    const apiBase = process.env.API_BASE_URL || "https://api.royalmotionit.com";
    try {
      const res = await fetch(
        `${apiBase}/whitelabel/tenant/resolve-subdomain?subdomain=${encodeURIComponent(subdomain)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(4000),
          next: { revalidate: 60 },
        },
      );

      if (res.ok) {
        const data: SubdomainResolutionResult = await res.json();

        if (data.found) {
          // If WhiteLabel has its backstage custom domain live, redirect directly
          if (data.backstageDomain) {
            const redirectUrl = `https://${data.backstageDomain}${pathname}${request.nextUrl.search}`;
            return NextResponse.redirect(redirectUrl, 307);
          }

          // If WhiteLabel is registered/in progress but hasn't finalized custom domain, render holding page
          const holdingUrl = new URL("/subdomain-holding", request.url);
          if (data.name) holdingUrl.searchParams.set("name", data.name);
          holdingUrl.searchParams.set("subdomain", subdomain);
          if (data.primaryColor) holdingUrl.searchParams.set("color", data.primaryColor);
          return NextResponse.rewrite(holdingUrl);
        }
      }
    } catch (err) {
      console.error(`[SubdomainProxy] Error resolving subdomain ${subdomain}:`, err);
    }

    // Subdomain is not registered or not permitted -> strictly return 404
    const notFoundUrl = new URL("/subdomain-not-found", request.url);
    notFoundUrl.searchParams.set("subdomain", subdomain);
    return NextResponse.rewrite(notFoundUrl, { status: 404 });
  }

  // Prevent direct public access to internal holding/404 pages on mother company domain
  if (isInternalSubdomainRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // =========================================================================
  // 2. Mother Company Platform Auth & RBAC (platform.royalmotionit.com)
  // =========================================================================
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const session = await meAction(sessionToken);

  const isAuthenticated = session.success && !!session.user;
  const user = session.user;
  const userRole = user?.role;

  const hasAdminPanelAccess = userRole ? ADMIN_ROLES.includes(userRole) : false;
  const hasClientPanelAccess = userRole === Role.CLIENT;

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
